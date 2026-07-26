<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Models\ActivityLog;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\TableSession;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    private const DISCOUNT_PERCENTAGE_THRESHOLD = 10;

    private const DISCOUNT_NOMINAL_THRESHOLD = 50000;

    public function index(): Response
    {
        $outlet = Outlet::first();
        $categories = MenuCategory::where('outlet_id', $outlet?->id)
            ->where('is_active', true)
            ->with(['menus' => fn ($q) => $q->with('optionGroups.optionItems')])
            ->orderBy('sort_order')
            ->get();

        $tables = Meja::with('lockedBy')
            ->where('outlet_id', $outlet?->id)
            ->orderBy('code')
            ->get();

        $activeSessions = TableSession::whereIn('table_id', $tables->pluck('id'))
            ->where('status', 'active')
            ->with(['table', 'orders' => fn ($q) => $q->with('items')])
            ->get();

        $groupedTables = [];
        foreach ($activeSessions as $session) {
            foreach ($session->orders as $order) {
                if (! empty($order->grouped_tables)) {
                    $groupedTables[$session->table_id] = $order->grouped_tables;
                }
            }
        }

        $pendingOrders = Order::where('status', 'pending')
            ->where('order_type', 'dine_in_qr')
            ->with(['tableSession.table', 'items.menu', 'items.options.optionItem'])
            ->orderByDesc('created_at')
            ->get();

        $lastOrder = null;
        if ($lastOrderId = session('last_order_id')) {
            $lastOrder = Order::with(['items.menu', 'items.options.optionItem', 'payment', 'tableSession.table', 'createdBy'])
                ->find($lastOrderId);
        }

        return Inertia::render('pos/Index', [
            'categories' => $categories,
            'tables' => $tables,
            'activeSessions' => $activeSessions,
            'pendingOrders' => $pendingOrders,
            'lastOrder' => $lastOrder,
            'groupedTables' => $groupedTables,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'payment_method' => 'nullable|in:cash,qris,debit,credit',
            'discount_type' => 'nullable|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_approved_by' => 'nullable|exists:users,id',
            'split_count' => 'nullable|integer|min:1|max:20',
            'order_type' => 'nullable|in:dine_in,takeaway',
            'customer_name' => 'nullable|string|max:255',
        ]);

        $session = null;
        $groupedTableIds = [];
        if ($validated['table_id'] ?? false) {
            $table = Meja::find($validated['table_id']);
            $session = $table->sessions()->where('status', 'active')->first();
            if (! $session) {
                $session = $table->sessions()->create([
                    'opened_at' => now(),
                    'status' => 'active',
                ]);
            }
            $table->update(['status' => 'occupied', 'locked_by' => null]);

            $extraTableIds = collect($validated['table_ids'] ?? [])
                ->reject(fn ($id) => (int) $id === (int) $validated['table_id'])
                ->unique()
                ->values()
                ->toArray();

            if (! empty($extraTableIds)) {
                Meja::whereIn('id', $extraTableIds)->update(['status' => 'occupied']);
                $groupedTableIds = $extraTableIds;
            }
        }

        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $itemTotal = $menu->price * $item['qty'];

            $selectedOptionIds = $item['option_ids'] ?? [];
            $optionAdjustments = [];

            if (! empty($selectedOptionIds)) {
                $counts = array_count_values($selectedOptionIds);
                $options = OptionItem::whereIn('id', array_keys($counts))->get()->keyBy('id');
                $adjustments = 0;
                $optionAdjustments = [];

                foreach ($counts as $optionId => $count) {
                    if (isset($options[$optionId])) {
                        $opt = $options[$optionId];
                        $adjustments += $opt->price_adjustment * $count;
                        $optionAdjustments[] = [
                            'option_item_id' => $opt->id,
                            'price_adjustment' => $opt->price_adjustment,
                            'quantity' => $count,
                        ];
                    }
                }

                $itemTotal += $adjustments * $item['qty'];
            }

            $subtotal += $itemTotal;

            $orderItems[] = [
                'menu_id' => $menu->id,
                'qty' => $item['qty'],
                'base_price' => $menu->price,
                'total_price' => $itemTotal,
                'notes' => $item['notes'] ?? null,
                'option_ids' => $selectedOptionIds,
                'option_adjustments' => $optionAdjustments,
            ];
        }

        $discountAmount = $this->calculateDiscount($subtotal, $validated);

        if ($discountAmount > 0 && $this->needsApproval($subtotal, $validated)) {
            $this->validateDiscountApproval($validated);

            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'large_discount',
                'subject_type' => null,
                'subject_id' => null,
                'description' => 'Diskon besar diterapkan: '.$validated['discount_type'].' '.$validated['discount_value'].' (disetujui: '.$validated['discount_approved_by'].')',
                'metadata' => $validated,
            ]);
        }

        $tax = round($subtotal * 0.10, 2);
        $serviceCharge = 0;

        $total = max(0, $subtotal + $tax - $discountAmount);

        $splitCount = (int) ($validated['split_count'] ?? 1);
        $splitSubtotal = round($subtotal / $splitCount, 2);
        $splitTax = round($tax / $splitCount, 2);
        $splitTotal = round($total / $splitCount, 2);
        $splitDiscount = round($discountAmount / $splitCount, 2);

        $createdOrders = [];

        for ($i = 0; $i < $splitCount; $i++) {
            $isLast = $i === $splitCount - 1;

            $shared = [
                'created_by' => $request->user()->id,
                'order_type' => $validated['order_type'] ?? 'dine_in',
                'customer_name' => $validated['customer_name'] ?? null,
                'status' => 'paid',
                'service_charge' => 0,
                'discount_type' => $validated['discount_type'] ?? null,
                'discount_value' => $validated['discount_value'] ?? null,
                'discount_approved_by' => $validated['discount_approved_by'] ?? null,
                'grouped_tables' => ! empty($groupedTableIds) ? $groupedTableIds : null,
            ];

            $order = $session?->orders()->create([
                ...$shared,
                'subtotal' => $isLast ? round($subtotal - $splitSubtotal * $i, 2) : $splitSubtotal,
                'tax' => $isLast ? round($tax - $splitTax * $i, 2) : $splitTax,
                'discount' => $isLast ? round($discountAmount - $splitDiscount * $i, 2) : $splitDiscount,
                'total' => $isLast ? round($total - $splitTotal * $i, 2) : $splitTotal,
                'notes' => $splitCount > 1 ? "Split {$i}/{$splitCount}" : null,
            ]) ?? Order::create([
                ...$shared,
                'subtotal' => $isLast ? round($subtotal - $splitSubtotal * $i, 2) : $splitSubtotal,
                'tax' => $isLast ? round($tax - $splitTax * $i, 2) : $splitTax,
                'discount' => $isLast ? round($discountAmount - $splitDiscount * $i, 2) : $splitDiscount,
                'total' => $isLast ? round($total - $splitTotal * $i, 2) : $splitTotal,
                'notes' => $splitCount > 1 ? "Split {$i}/{$splitCount}" : null,
            ]);

            foreach ($orderItems as $orderItemData) {
                $orderItem = $order->items()->create([
                    'menu_id' => $orderItemData['menu_id'],
                    'qty' => $orderItemData['qty'],
                    'base_price' => $orderItemData['base_price'],
                    'total_price' => $orderItemData['total_price'],
                    'notes' => $orderItemData['notes'],
                ]);

                if (! empty($orderItemData['option_adjustments'])) {
                    $orderItem->options()->createMany($orderItemData['option_adjustments']);
                }
            }

            if (! empty($validated['payment_method'])) {
                $order->payment()->create([
                    'method' => $validated['payment_method'],
                    'gross_amount' => $order->total,
                    'status' => 'settlement',
                ]);
            }

            $createdOrders[] = $order;
            broadcast(new OrderCreated($order))->toOthers();
            broadcast(new OrderPaid($order))->toOthers();
        }

        $firstOrder = $createdOrders[0] ?? null;

        return redirect()->route('pos.index')
            ->with('success', $splitCount > 1
                ? "Pesanan berhasil dibuat ({$splitCount} bill)."
                : 'Pesanan berhasil dibuat.')
            ->with('last_order_id', $firstOrder?->id);
    }

    public function confirmPay(Request $request, Order $order): RedirectResponse
    {
        abort_if($order->status !== 'pending', 403);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:order_items,id',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'payment_method' => 'required|in:cash,qris,debit,credit',
            'discount_type' => 'nullable|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_approved_by' => 'nullable|exists:users,id',
        ]);

        $existingItemIds = $order->items()->pluck('id')->toArray();
        $keptItemIds = [];
        $newSubtotal = 0;

        foreach ($validated['items'] as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $itemTotal = $menu->price * $itemData['qty'];

            $selectedOptionIds = $itemData['option_ids'] ?? [];
            $optionAdjustments = [];

            if (! empty($selectedOptionIds)) {
                $counts = array_count_values($selectedOptionIds);
                $options = OptionItem::whereIn('id', array_keys($counts))->get()->keyBy('id');
                $adjustments = 0;
                $optionAdjustments = [];

                foreach ($counts as $optionId => $count) {
                    if (isset($options[$optionId])) {
                        $opt = $options[$optionId];
                        $adjustments += $opt->price_adjustment * $count;
                        $optionAdjustments[] = [
                            'option_item_id' => $opt->id,
                            'price_adjustment' => $opt->price_adjustment,
                            'quantity' => $count,
                        ];
                    }
                }

                $itemTotal += $adjustments * $itemData['qty'];
            }

            $newSubtotal += $itemTotal;

            if (! empty($itemData['id']) && in_array($itemData['id'], $existingItemIds)) {
                $keptItemIds[] = $itemData['id'];
                $orderItem = OrderItem::find($itemData['id']);
                $orderItem->update([
                    'qty' => $itemData['qty'],
                    'total_price' => $itemTotal,
                    'notes' => $itemData['notes'] ?? null,
                ]);
                $orderItem->options()->delete();
                if (! empty($optionAdjustments)) {
                    $orderItem->options()->createMany($optionAdjustments);
                }
            } else {
                $orderItem = $order->items()->create([
                    'menu_id' => $menu->id,
                    'qty' => $itemData['qty'],
                    'base_price' => $menu->price,
                    'total_price' => $itemTotal,
                    'notes' => $itemData['notes'] ?? null,
                ]);
                if (! empty($optionAdjustments)) {
                    $orderItem->options()->createMany($optionAdjustments);
                }
            }
        }

        $itemsToDelete = array_diff($existingItemIds, $keptItemIds);
        if (! empty($itemsToDelete)) {
            OrderItem::whereIn('id', $itemsToDelete)->delete();
        }

        $discountAmount = $this->calculateDiscount($newSubtotal, $validated);

        if ($discountAmount > 0 && $this->needsApproval($newSubtotal, $validated)) {
            $this->validateDiscountApproval($validated);

            ActivityLog::create([
                'user_id' => $request->user()->id,
                'action' => 'large_discount',
                'subject_type' => null,
                'subject_id' => null,
                'description' => 'Diskon besar diterapkan (confirm pay): '.$validated['discount_type'].' '.$validated['discount_value'].' (disetujui: '.$validated['discount_approved_by'].')',
                'metadata' => $validated,
            ]);
        }

        $taxRate = 0.10;
        $tax = round($newSubtotal * $taxRate, 2);
        $serviceCharge = 0;

        $newTotal = max(0, $newSubtotal + $tax - $discountAmount);

        $order->update([
            'status' => 'paid',
            'subtotal' => $newSubtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $newTotal,
        ]);

        $order->payment()->create([
            'method' => $validated['payment_method'],
            'gross_amount' => $newTotal,
            'status' => 'settlement',
        ]);

        if ($order->tableSession?->table) {
            $order->tableSession->table->update(['status' => 'occupied']);
        }

        broadcast(new OrderPaid($order))->toOthers();
        broadcast(new OrderStatusUpdated($order))->toOthers();

        return redirect()->route('pos.index')
            ->with('success', 'Pesanan berhasil dikonfirmasi dan dibayar.')
            ->with('last_order_id', $order->id);
    }

    public function initiatePayment(Request $request, MidtransService $midtrans): JsonResponse
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'payment_type' => 'required|string|max:50',
            'discount_type' => 'nullable|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_approved_by' => 'nullable|exists:users,id',
            'order_type' => 'nullable|in:dine_in,takeaway',
            'customer_name' => 'nullable|string|max:255',
        ]);

        $paymentType = $validated['payment_type'];

        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $itemTotal = $menu->price * $item['qty'];

            $selectedOptionIds = $item['option_ids'] ?? [];
            $optionAdjustments = [];

            if (! empty($selectedOptionIds)) {
                $counts = array_count_values($selectedOptionIds);
                $options = OptionItem::whereIn('id', array_keys($counts))->get()->keyBy('id');
                $adjustments = 0;
                $optionAdjustments = [];

                foreach ($counts as $optionId => $count) {
                    if (isset($options[$optionId])) {
                        $opt = $options[$optionId];
                        $adjustments += $opt->price_adjustment * $count;
                        $optionAdjustments[] = [
                            'option_item_id' => $opt->id,
                            'price_adjustment' => $opt->price_adjustment,
                            'quantity' => $count,
                        ];
                    }
                }

                $itemTotal += $adjustments * $item['qty'];
            }

            $subtotal += $itemTotal;

            $orderItems[] = [
                'menu_id' => $menu->id,
                'qty' => $item['qty'],
                'base_price' => $menu->price,
                'total_price' => $itemTotal,
                'notes' => $item['notes'] ?? null,
                'option_adjustments' => $optionAdjustments,
            ];
        }

        $discountAmount = $this->calculateDiscount($subtotal, $validated);

        if ($discountAmount > 0 && $this->needsApproval($subtotal, $validated)) {
            $this->validateDiscountApproval($validated);
        }

        $tax = round($subtotal * 0.10, 2);
        $serviceCharge = round($subtotal * 0.05, 2);
        $totalBeforeCharge = max(0, $subtotal + $tax + $serviceCharge - $discountAmount);
        $chargePercent = (float) config('midtrans.charge_percentage', 2.5);
        $midtransCharge = round($totalBeforeCharge * $chargePercent / 100 / 100) * 100;
        $total = $totalBeforeCharge + $midtransCharge;

        $session = null;
        if ($validated['table_id'] ?? false) {
            $table = Meja::find($validated['table_id']);
            $session = $table->sessions()->where('status', 'active')->first() ?? $table->sessions()->create([
                'opened_at' => now(),
                'status' => 'active',
            ]);
            $table->update(['status' => 'occupied', 'locked_by' => null]);
        }

        $orderType = $validated['order_type'] ?? 'dine_in';
        $order = $session?->orders()->create([
            'created_by' => $request->user()->id,
            'order_type' => $orderType,
            'customer_name' => $validated['customer_name'] ?? null,
            'status' => 'pending_payment',
            'subtotal' => $subtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'midtrans_charge' => $midtransCharge,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $total,
        ]) ?? Order::create([
            'created_by' => $request->user()->id,
            'order_type' => $orderType,
            'customer_name' => $validated['customer_name'] ?? null,
            'status' => 'pending_payment',
            'subtotal' => $subtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'midtrans_charge' => $midtransCharge,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $total,
        ]);

        foreach ($orderItems as $orderItemData) {
            $optionAdjustments = $orderItemData['option_adjustments'];
            unset($orderItemData['option_adjustments']);

            $orderItem = $order->items()->create($orderItemData);

            if (! empty($optionAdjustments)) {
                $orderItem->options()->createMany($optionAdjustments);
            }
        }

        $midtransResponse = $midtrans->createCharge((string) $order->id, (int) round($total), $paymentType);
        $midtransTransactionId = $midtransResponse['transaction_id'] ?? null;

        $paymentData = $this->extractPaymentResponse($midtransResponse);

        $order->payment()->create([
            'method' => $paymentType,
            'midtrans_transaction_id' => $midtransTransactionId,
            'gross_amount' => $total,
            'status' => 'pending',
            'raw_payload' => $midtransResponse ? json_encode($midtransResponse) : null,
        ]);

        return response()->json([
            'order_id' => $order->id,
            'order_number' => "TRX-LW-{$order->id}",
            'subtotal' => $subtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'midtrans_charge' => $midtransCharge,
            'total' => $total,
            'payment_type' => $paymentType,
            'transaction_id' => $midtransTransactionId,
            ...$paymentData,
        ]);
    }

    private function extractPaymentResponse(array $response): array
    {
        $data = [];

        if (! empty($response['actions'])) {
            foreach ($response['actions'] as $action) {
                if ($action['name'] === 'generate-qr-code') {
                    $data['qr_code'] = $action['url'];
                }
                if ($action['name'] === 'deeplink-redirect') {
                    $data['deeplink_url'] = $action['url'];
                }
            }
        }

        if (! empty($response['va_numbers'])) {
            $data['va_number'] = $response['va_numbers'][0]['va_number'];
            $data['bank'] = $response['va_numbers'][0]['bank'];
        }

        if (! empty($response['permata_va_number'])) {
            $data['va_number'] = $response['permata_va_number'];
            $data['bank'] = 'permata';
        }

        if (! empty($response['bill_key'])) {
            $data['bill_key'] = $response['bill_key'];
            $data['biller_code'] = $response['biller_code'] ?? null;
        }

        if (! empty($response['payment_code'])) {
            $data['payment_code'] = $response['payment_code'];
            $data['store'] = $response['store'] ?? null;
        }

        return $data;
    }

    public function qrisStatus(Order $order, MidtransService $midtrans): JsonResponse
    {
        if ($order->status === 'paid') {
            return response()->json(['status' => 'settlement']);
        }

        $midtransResponse = $midtrans->getTransactionStatus((string) $order->id);

        $status = $midtransResponse['transaction_status'] ?? 'unknown';

        $mapped = match ($status) {
            'capture', 'settlement' => 'settlement',
            'pending' => 'pending',
            'expire', 'cancel', 'deny' => 'failed',
            default => 'pending',
        };

        if ($mapped !== 'pending' && $order->payment) {
            $order->payment->update(['status' => $mapped]);
            if ($mapped === 'settlement') {
                $order->update(['status' => 'paid']);
                broadcast(new OrderPaid($order))->toOthers();
                broadcast(new OrderStatusUpdated($order))->toOthers();
            } elseif ($mapped === 'failed') {
                $order->update(['status' => 'cancelled']);
                broadcast(new OrderStatusUpdated($order))->toOthers();
            }
        }

        return response()->json(['status' => $mapped]);
    }

    public function releaseTable(Request $request, Meja $table): RedirectResponse
    {
        $session = $table->sessions()->where('status', 'active')->first();
        $groupedIds = [];

        if ($session) {
            $session->orders()->whereIn('status', ['pending', 'pending_payment'])
                ->update(['status' => 'cancelled']);

            $groupedIds = $session->orders()
                ->whereNotNull('grouped_tables')
                ->pluck('grouped_tables')
                ->flatten()
                ->unique()
                ->values()
                ->toArray();

            $session->update([
                'status' => 'closed',
                'closed_at' => now(),
            ]);
        }

        $affected = collect([$table->id, ...$groupedIds])->unique();
        Meja::whereIn('id', $affected)->update(['status' => 'available']);

        return redirect()->route('pos.index')
            ->with('success', "Meja {$table->code} berhasil dikosongkan.");
    }

    public function lockTable(Request $request, Meja $table): JsonResponse
    {
        if ($table->status !== 'available') {
            return response()->json([
                'message' => "Meja {$table->code} tidak tersedia.",
            ], 422);
        }

        $table->update([
            'status' => 'locked',
            'locked_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => "Meja {$table->code} terkunci.",
            'table' => $table->fresh()->load('lockedBy'),
        ]);
    }

    public function unlockTable(Request $request, Meja $table): JsonResponse
    {
        $table->update([
            'status' => 'available',
            'locked_by' => null,
        ]);

        return response()->json([
            'message' => "Meja {$table->code} tersedia.",
            'table' => $table->fresh()->load('lockedBy'),
        ]);
    }

    public function moveTable(Meja $table, Meja $target): RedirectResponse
    {
        if ($table->status !== 'occupied') {
            return redirect()->route('pos.index')
                ->with('error', "Meja {$table->code} tidak sedang digunakan.");
        }

        if ($target->status !== 'available') {
            return redirect()->route('pos.index')
                ->with('error', "Meja {$target->code} sedang digunakan.");
        }

        $sourceSession = $table->sessions()->where('status', 'active')->first();

        if (! $sourceSession) {
            return redirect()->route('pos.index')
                ->with('error', "Tidak ada sesi aktif untuk meja {$table->code}.");
        }

        $targetSession = $target->sessions()->where('status', 'active')->first()
            ?? $target->sessions()->create([
                'opened_at' => now(),
                'status' => 'active',
            ]);

        $sourceSession->orders()->update(['table_session_id' => $targetSession->id]);

        $sourceSession->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        $table->update(['status' => 'available']);
        $target->update(['status' => 'occupied']);

        return redirect()->route('pos.index')
            ->with('success', "Meja {$table->code} dipindah ke Meja {$target->code}.");
    }

    public function mergeTable(Meja $table, Meja $target): RedirectResponse
    {
        if ($table->status !== 'occupied') {
            return redirect()->route('pos.index')
                ->with('error', "Meja {$table->code} tidak sedang digunakan.");
        }

        if ($target->status !== 'occupied') {
            return redirect()->route('pos.index')
                ->with('error', "Meja {$target->code} tidak sedang digunakan.");
        }

        $sourceSession = $table->sessions()->where('status', 'active')->first();
        $targetSession = $target->sessions()->where('status', 'active')->first();

        if (! $sourceSession || ! $targetSession) {
            return redirect()->route('pos.index')
                ->with('error', 'Sesi meja tidak ditemukan.');
        }

        $movedOrders = $sourceSession->orders()
            ->whereIn('status', ['pending', 'pending_payment'])
            ->get();

        foreach ($movedOrders as $order) {
            $grouped = $order->grouped_tables ?? [];
            if (! in_array($table->id, $grouped)) {
                $grouped[] = $table->id;
            }
            $order->update([
                'table_session_id' => $targetSession->id,
                'grouped_tables' => $grouped,
            ]);
        }

        $sourceSession->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        $target->update(['status' => 'occupied', 'locked_by' => null]);
        $table->update(['status' => 'occupied', 'locked_by' => null]);

        return redirect()->route('pos.index')
            ->with('success', "Meja {$table->code} digabung ke Meja {$target->code}.");
    }

    public function verifyApproval(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (! $user->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json(['message' => 'Hanya Admin atau Owner yang dapat menyetujui diskon besar.'], 403);
        }

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Password salah.'], 422);
        }

        return response()->json(['approved_by' => $user->id]);
    }

    private function calculateDiscount(float $subtotal, array $validated): float
    {
        if (empty($validated['discount_type']) || empty($validated['discount_value'])) {
            return 0;
        }

        $value = (float) $validated['discount_value'];

        if ($validated['discount_type'] === 'percentage') {
            return min($subtotal * ($value / 100), $subtotal);
        }

        return min($value, $subtotal);
    }

    private function needsApproval(float $subtotal, array $validated): bool
    {
        $type = $validated['discount_type'] ?? null;
        $value = (float) ($validated['discount_value'] ?? 0);

        if ($type === 'percentage' && $value > self::DISCOUNT_PERCENTAGE_THRESHOLD) {
            return true;
        }

        if ($type === 'nominal' && $value > self::DISCOUNT_NOMINAL_THRESHOLD) {
            return true;
        }

        return false;
    }

    private function validateDiscountApproval(array $validated): void
    {
        if (empty($validated['discount_approved_by'])) {
            throw ValidationException::withMessages([
                'discount' => 'Diskon besar memerlukan persetujuan Admin/Owner.',
            ]);
        }

        $approver = User::find($validated['discount_approved_by']);
        if (! $approver || ! $approver->hasAnyRole(['Admin', 'Owner'])) {
            throw ValidationException::withMessages([
                'discount' => 'Hanya Admin atau Owner yang dapat menyetujui diskon besar.',
            ]);
        }
    }
}

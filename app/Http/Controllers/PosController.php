<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
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

        $tables = Meja::where('outlet_id', $outlet?->id)
            ->orderBy('code')
            ->get();

        $activeSessions = TableSession::whereIn('table_id', $tables->pluck('id'))
            ->where('status', 'active')
            ->with(['table', 'orders' => fn ($q) => $q->with('items')])
            ->get();

        $pendingOrders = Order::where('status', 'pending')
            ->where('order_type', 'dine_in_qr')
            ->with(['tableSession.table', 'items.menu', 'items.options.optionItem'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('pos/Index', [
            'categories' => $categories,
            'tables' => $tables,
            'activeSessions' => $activeSessions,
            'pendingOrders' => $pendingOrders,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
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
        ]);

        $session = null;
        if ($validated['table_id'] ?? false) {
            $table = Meja::find($validated['table_id']);
            $session = $table->sessions()->where('status', 'active')->first();
            if (! $session) {
                $session = $table->sessions()->create([
                    'opened_at' => now(),
                    'status' => 'active',
                ]);
            }
            $table->update(['status' => 'occupied']);
        }

        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $itemTotal = $menu->price * $item['qty'];

            if (! empty($item['option_ids'])) {
                $adjustments = OptionItem::whereIn('id', $item['option_ids'])
                    ->pluck('price_adjustment')
                    ->sum();
                $itemTotal += $adjustments * $item['qty'];
            }

            $subtotal += $itemTotal;

            $orderItems[] = [
                'menu_id' => $menu->id,
                'qty' => $item['qty'],
                'base_price' => $menu->price,
                'total_price' => $itemTotal,
                'notes' => $item['notes'] ?? null,
            ];
        }

        $discountAmount = $this->calculateDiscount($subtotal, $validated);

        if ($discountAmount > 0 && $this->needsApproval($subtotal, $validated)) {
            $this->validateDiscountApproval($validated);
        }

        $total = max(0, $subtotal - $discountAmount);

        $splitCount = (int) ($validated['split_count'] ?? 1);
        $splitSubtotal = round($subtotal / $splitCount, 2);
        $splitTotal = round($total / $splitCount, 2);
        $splitDiscount = round($discountAmount / $splitCount, 2);

        $createdOrders = [];

        for ($i = 0; $i < $splitCount; $i++) {
            $isLast = $i === $splitCount - 1;

            $order = $session?->orders()->create([
                'created_by' => $request->user()->id,
                'order_type' => 'cashier',
                'status' => 'paid',
                'subtotal' => $isLast ? round($subtotal - $splitSubtotal * $i, 2) : $splitSubtotal,
                'tax' => 0,
                'discount' => $isLast ? round($discountAmount - $splitDiscount * $i, 2) : $splitDiscount,
                'discount_type' => $validated['discount_type'] ?? null,
                'discount_value' => $validated['discount_value'] ?? null,
                'discount_approved_by' => $validated['discount_approved_by'] ?? null,
                'total' => $isLast ? round($total - $splitTotal * $i, 2) : $splitTotal,
                'notes' => $splitCount > 1 ? "Split {$i}/{$splitCount}" : null,
            ]) ?? Order::create([
                'created_by' => $request->user()->id,
                'order_type' => 'cashier',
                'status' => 'paid',
                'subtotal' => $isLast ? round($subtotal - $splitSubtotal * $i, 2) : $splitSubtotal,
                'tax' => 0,
                'discount' => $isLast ? round($discountAmount - $splitDiscount * $i, 2) : $splitDiscount,
                'discount_type' => $validated['discount_type'] ?? null,
                'discount_value' => $validated['discount_value'] ?? null,
                'discount_approved_by' => $validated['discount_approved_by'] ?? null,
                'total' => $isLast ? round($total - $splitTotal * $i, 2) : $splitTotal,
                'notes' => $splitCount > 1 ? "Split {$i}/{$splitCount}" : null,
            ]);

            foreach ($orderItems as $orderItemData) {
                $itemTotal = $orderItemData['base_price'] * $orderItemData['qty'];
                $order->items()->create([
                    'menu_id' => $orderItemData['menu_id'],
                    'qty' => $orderItemData['qty'],
                    'base_price' => $orderItemData['base_price'],
                    'total_price' => $itemTotal,
                    'notes' => $orderItemData['notes'],
                ]);
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

        return redirect()->route('pos.index')->with('success', $splitCount > 1
            ? "Pesanan berhasil dibuat ({$splitCount} bill)."
            : 'Pesanan berhasil dibuat.');
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
            $optionTotal = 0;

            if (! empty($itemData['option_ids'])) {
                $adjustments = OptionItem::whereIn('id', $itemData['option_ids'])
                    ->pluck('price_adjustment')
                    ->sum();
                $optionTotal = $adjustments * $itemData['qty'];
            }

            $itemTotal += $optionTotal;
            $newSubtotal += $itemTotal;

            if (! empty($itemData['id']) && in_array($itemData['id'], $existingItemIds)) {
                $keptItemIds[] = $itemData['id'];
                $orderItem = OrderItem::find($itemData['id']);
                $orderItem->update([
                    'qty' => $itemData['qty'],
                    'total_price' => $itemTotal,
                    'notes' => $itemData['notes'] ?? null,
                ]);
            } else {
                $order->items()->create([
                    'menu_id' => $menu->id,
                    'qty' => $itemData['qty'],
                    'base_price' => $menu->price,
                    'total_price' => $itemTotal,
                    'notes' => $itemData['notes'] ?? null,
                ]);
            }
        }

        $itemsToDelete = array_diff($existingItemIds, $keptItemIds);
        if (! empty($itemsToDelete)) {
            OrderItem::whereIn('id', $itemsToDelete)->delete();
        }

        $discountAmount = $this->calculateDiscount($newSubtotal, $validated);

        if ($discountAmount > 0 && $this->needsApproval($newSubtotal, $validated)) {
            $this->validateDiscountApproval($validated);
        }

        $newTotal = max(0, $newSubtotal - $discountAmount);

        $order->update([
            'status' => 'paid',
            'subtotal' => $newSubtotal,
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

        return redirect()->route('pos.index')->with('success', 'Pesanan berhasil dikonfirmasi dan dibayar.');
    }

    public function initiateQris(Request $request, MidtransService $midtrans): JsonResponse
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.qty' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.option_ids' => 'nullable|array',
            'items.*.option_ids.*' => 'exists:option_items,id',
            'discount_type' => 'nullable|in:percentage,nominal',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_approved_by' => 'nullable|exists:users,id',
        ]);

        $subtotal = 0;

        foreach ($validated['items'] as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $itemTotal = $menu->price * $item['qty'];

            if (! empty($item['option_ids'])) {
                $adjustments = OptionItem::whereIn('id', $item['option_ids'])
                    ->pluck('price_adjustment')
                    ->sum();
                $itemTotal += $adjustments * $item['qty'];
            }

            $subtotal += $itemTotal;
        }

        $discountAmount = $this->calculateDiscount($subtotal, $validated);

        if ($discountAmount > 0 && $this->needsApproval($subtotal, $validated)) {
            $this->validateDiscountApproval($validated);
        }

        $total = max(0, $subtotal - $discountAmount);

        $session = null;
        if ($validated['table_id'] ?? false) {
            $table = Meja::find($validated['table_id']);
            $session = $table->sessions()->where('status', 'active')->first() ?? $table->sessions()->create([
                'opened_at' => now(),
                'status' => 'active',
            ]);
            $table->update(['status' => 'occupied']);
        }

        $order = $session?->orders()->create([
            'created_by' => $request->user()->id,
            'order_type' => 'cashier',
            'status' => 'pending_payment',
            'subtotal' => $subtotal,
            'tax' => 0,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $total,
        ]) ?? Order::create([
            'created_by' => $request->user()->id,
            'order_type' => 'cashier',
            'status' => 'pending_payment',
            'subtotal' => $subtotal,
            'tax' => 0,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $total,
        ]);

        $qrisResponse = $midtrans->createQrisCharge((string) $order->id, (int) round($total));
        $qrCodeUrl = $qrisResponse['actions'][0]['url'] ?? null;
        $midtransTransactionId = $qrisResponse['transaction_id'] ?? null;

        $order->payment()->create([
            'method' => 'qris',
            'midtrans_transaction_id' => $midtransTransactionId,
            'gross_amount' => $total,
            'status' => 'pending',
            'raw_payload' => $qrisResponse ? json_encode($qrisResponse) : null,
        ]);

        return response()->json([
            'order_id' => $order->id,
            'order_number' => $orderId,
            'total' => $total,
            'qr_code' => $qrCodeUrl,
            'transaction_id' => $midtransTransactionId,
        ]);
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

        return response()->json(['status' => $mapped]);
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

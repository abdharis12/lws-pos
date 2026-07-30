<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\TableStatus;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Http\Requests\Pos\ConfirmPayRequest;
use App\Http\Requests\Pos\InitiatePaymentRequest;
use App\Http\Requests\Pos\StoreOrderRequest;
use App\Http\Requests\Pos\UpdateItemsRequest;
use App\Http\Requests\Pos\VerifyApprovalRequest;
use App\Models\Meja;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\PosSession;
use App\Models\TableSession;
use App\Services\ActivityLogService;
use App\Services\DiscountService;
use App\Services\MidtransService;
use App\Services\PaymentService;
use App\Services\PosOrderService;
use App\Services\PosTableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        private readonly PosOrderService $orderService,
        private readonly PosTableService $tableService,
        private readonly ActivityLogService $activityLog,
        private readonly DiscountService $discountService,
        private readonly PaymentService $paymentService,
    ) {}

    public function index(): Response
    {
        $outlet = Outlet::first();
        $outletId = $outlet?->id;

        $categories = MenuCategory::where('outlet_id', $outletId)
            ->where('is_active', true)
            ->with(['menus' => fn ($q) => $q->with('optionGroups.optionItems')])
            ->orderBy('sort_order')
            ->get();

        $tables = Meja::with('lockedBy')
            ->where('outlet_id', $outletId)
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

        $pendingOrders = Order::whereIn('status', [OrderStatus::Pending, OrderStatus::PendingPayment])
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

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $session = null;
        $groupedTableIds = [];

        $posSessionId = null;
        $outlet = Outlet::first();
        if ($outlet) {
            $posSession = PosSession::where('outlet_id', $outlet->id)
                ->whereDate('session_date', today())
                ->where('status', 'open')
                ->first();
            $posSessionId = $posSession?->id;
        }

        if ($validated['table_id'] ?? false) {
            $table = Meja::find($validated['table_id']);
            $this->authorize('create', [Order::class, $table]);

            $session = $this->orderService->getOrCreateSession($table);
            $table->update(['status' => TableStatus::Occupied, 'locked_by' => null]);

            if (! empty($validated['table_ids'])) {
                $groupedTableIds = $this->orderService->prepareGroupedTables(
                    $validated['table_ids'], $validated['table_id'],
                );
                if (! empty($groupedTableIds)) {
                    Meja::whereIn('id', $groupedTableIds)->update(['status' => TableStatus::Occupied]);
                }
            }
        }

        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $subtotal = array_sum(array_column($orderItems, 'total_price'));

        if ($this->orderService->needsApproval($subtotal, $validated)) {
            $this->orderService->validateApproval($validated);
            $this->activityLog->log(
                $user, 'large_discount', null, null,
                'Diskon besar diterapkan: '.($validated['discount_type'] ?? '').' '.($validated['discount_value'] ?? ''),
                $validated,
            );
        }

        $createdOrders = $this->orderService->createSplitOrders(
            $user, $validated, $orderItems, $groupedTableIds, $session, $posSessionId,
        );

        $firstOrder = $createdOrders[0] ?? null;
        $splitCount = (int) ($validated['split_count'] ?? 1);

        Inertia::flash('toast', ['type' => 'success', 'message' => $splitCount > 1
            ? "Pesanan berhasil dibuat ({$splitCount} bill)."
            : 'Pesanan berhasil dibuat.']);

        return redirect()->route('pos.index')
            ->with('last_order_id', $firstOrder?->id);
    }

    public function confirmPay(ConfirmPayRequest $request, Order $order): RedirectResponse
    {
        $this->authorize('update', $order);
        abort_if($order->status !== OrderStatus::Pending, 403);

        $validated = $request->validated();
        $user = $request->user();

        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $newSubtotal = array_sum(array_column($orderItems, 'total_price'));

        if ($this->orderService->needsApproval($newSubtotal, $validated)) {
            $this->orderService->validateApproval($validated);
            $this->activityLog->log(
                $user, 'large_discount', 'order', $order->id,
                'Diskon besar diterapkan (confirm pay): '.($validated['discount_type'] ?? '').' '.($validated['discount_value'] ?? ''),
                $validated,
            );
        }

        $this->orderService->confirmAndFinalizeOrder($order, $validated, $user->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan berhasil dikonfirmasi dan dibayar.']);

        return redirect()->route('pos.index')->with('last_order_id', $order->id);
    }

    public function initiatePayment(InitiatePaymentRequest $request, MidtransService $midtrans): JsonResponse
    {
        try {
            $validated = $request->validated();
            $user = $request->user();

            $orderItems = $this->orderService->buildOrderItems($validated['items']);
            $subtotal = array_sum(array_column($orderItems, 'total_price'));

            if ($this->orderService->needsApproval($subtotal, $validated)) {
                $this->orderService->validateApproval($validated);
            }

            $posSessionId = null;
            $outlet = Outlet::first();
            if ($outlet) {
                $posSession = PosSession::where('outlet_id', $outlet->id)
                    ->whereDate('session_date', today())
                    ->where('status', 'open')
                    ->first();
                $posSessionId = $posSession?->id;
            }

            $session = null;
            if ($validated['table_id'] ?? false) {
                $table = Meja::find($validated['table_id']);
                $session = $this->orderService->getOrCreateSession($table);
                $table->update(['status' => TableStatus::Occupied, 'locked_by' => null]);
            }

            $order = $this->orderService->getOrCreatePaymentOrder($user, $validated, $orderItems, $session, $posSessionId);

            $midtransResponse = $midtrans->createCharge(
                (string) $order->id,
                (int) round((float) $order->total),
                $validated['payment_type'],
            );

            $paymentData = $this->paymentService->extractPaymentResponse($midtransResponse);
            $this->paymentService->createPaymentRecord($order, $midtransResponse, $validated['payment_type'], (float) $order->total);

            $orderNumber = config('pos.order_number_prefix', 'TRX-LW-').$order->id;

            return response()->json([
                'order_id' => $order->id,
                'order_number' => $orderNumber,
                'subtotal' => $order->subtotal,
                'tax' => $order->tax,
                'service_charge' => $order->service_charge,
                'midtrans_charge' => $order->midtrans_charge,
                'total' => $order->total,
                'payment_type' => $validated['payment_type'],
                'transaction_id' => $midtransResponse['transaction_id'] ?? null,
                ...$paymentData,
            ]);
        } catch (\Exception $e) {
            Log::error('Payment initiation failed', [
                'message' => $e->getMessage(),
                'user_id' => $request->user()?->id,
                'payment_type' => $request->validated('payment_type'),
            ]);

            return response()->json([
                'message' => 'Gagal memproses pembayaran. Silakan coba lagi.',
            ], 500);
        }
    }

    public function qrisStatus(Order $order, MidtransService $midtrans): JsonResponse
    {
        $this->authorize('view', $order);

        if ($order->status === OrderStatus::Paid) {
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
                $order->update(['status' => OrderStatus::Paid]);
                broadcast(new OrderPaid($order))->toOthers();
                broadcast(new OrderStatusUpdated($order))->toOthers();
            } elseif ($mapped === 'failed') {
                $order->update(['status' => OrderStatus::Cancelled]);
                broadcast(new OrderStatusUpdated($order))->toOthers();
            }
        }

        return response()->json(['status' => $mapped]);
    }

    public function releaseTable(Meja $table): RedirectResponse
    {
        $this->authorize('update', $table);
        $this->tableService->release($table);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Meja {$table->code} berhasil dikosongkan."]);

        return redirect()->route('pos.index');
    }

    public function lockTable(Request $request, Meja $table): JsonResponse
    {
        $this->authorize('update', $table);

        if ($table->status !== TableStatus::Available) {
            return response()->json([
                'message' => "Meja {$table->code} tidak tersedia.",
            ], 422);
        }

        $this->tableService->lock($table, $request->user()->id);

        return response()->json([
            'message' => "Meja {$table->code} terkunci.",
            'table' => $table->fresh()->load('lockedBy'),
        ]);
    }

    public function unlockTable(Meja $table): JsonResponse
    {
        $this->authorize('update', $table);
        $this->tableService->unlock($table);

        return response()->json([
            'message' => "Meja {$table->code} tersedia.",
            'table' => $table->fresh()->load('lockedBy'),
        ]);
    }

    public function moveTable(Meja $table, Meja $target): RedirectResponse
    {
        $this->authorize('update', $table);
        $this->authorize('update', $target);

        if ($table->status !== TableStatus::Occupied) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "Meja {$table->code} tidak sedang digunakan."]);

            return redirect()->route('pos.index');
        }

        if ($target->status !== TableStatus::Available) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "Meja {$target->code} sedang digunakan."]);

            return redirect()->route('pos.index');
        }

        if (! $table->sessions()->where('status', 'active')->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "Tidak ada sesi aktif untuk meja {$table->code}."]);

            return redirect()->route('pos.index');
        }

        $this->tableService->move($table, $target);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Meja {$table->code} dipindah ke Meja {$target->code}."]);

        return redirect()->route('pos.index');
    }

    public function mergeTable(Meja $table, Meja $target): RedirectResponse
    {
        $this->authorize('update', $table);
        $this->authorize('update', $target);

        if ($table->status !== TableStatus::Occupied) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "Meja {$table->code} tidak sedang digunakan."]);

            return redirect()->route('pos.index');
        }

        if ($target->status !== TableStatus::Occupied) {
            Inertia::flash('toast', ['type' => 'error', 'message' => "Meja {$target->code} tidak sedang digunakan."]);

            return redirect()->route('pos.index');
        }

        $sourceSession = $table->sessions()->where('status', 'active')->first();
        $targetSession = $target->sessions()->where('status', 'active')->first();

        if (! $sourceSession || ! $targetSession) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Sesi meja tidak ditemukan.']);

            return redirect()->route('pos.index');
        }

        $this->tableService->merge($table, $target);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Meja {$table->code} digabung ke Meja {$target->code}."]);

        return redirect()->route('pos.index');
    }

    public function verifyApproval(VerifyApprovalRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json(['message' => 'Hanya Admin atau Owner yang dapat menyetujui diskon besar.'], 403);
        }

        if (! Hash::check($request->validated()['password'], $user->password)) {
            return response()->json(['message' => 'Password salah.'], 422);
        }

        return response()->json(['approved_by' => $user->id]);
    }

    public function updateItems(UpdateItemsRequest $request, Order $order): RedirectResponse
    {
        $this->authorize('update', $order);
        abort_if(! in_array($order->status, [OrderStatus::Pending, OrderStatus::PendingPayment], true), 403);

        $this->orderService->updateOrderItems($order, $request->validated()['items']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroyPending(Order $order): RedirectResponse
    {
        $this->authorize('update', $order);
        abort_if(! in_array($order->status, [OrderStatus::Pending, OrderStatus::PendingPayment], true), 403);

        $this->orderService->cancelPendingOrder($order);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan berhasil dibatalkan.']);

        return redirect()->back();
    }
}

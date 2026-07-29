<?php

namespace App\Http\Controllers;

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
use App\Models\TableSession;
use App\Services\MidtransService;
use App\Services\PosOrderService;
use App\Services\PosTableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        private readonly PosOrderService $orderService,
        private readonly PosTableService $tableService,
    ) {}

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

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $session = null;
        $groupedTableIds = [];

        if ($validated['table_id'] ?? false) {
            $table = Meja::find($validated['table_id']);
            $session = $this->orderService->getOrCreateSession($table);
            $table->update(['status' => 'occupied', 'locked_by' => null]);

            if (! empty($validated['table_ids'])) {
                $groupedTableIds = $this->orderService->prepareGroupedTables(
                    $validated['table_ids'], $validated['table_id'],
                );
                if (! empty($groupedTableIds)) {
                    Meja::whereIn('id', $groupedTableIds)->update(['status' => 'occupied']);
                }
            }
        }

        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $subtotal = array_sum(array_column($orderItems, 'total_price'));

        $discountAmount = $this->orderService->calculateDiscount($subtotal, $validated);
        if ($discountAmount > 0 && $this->orderService->needsApproval($subtotal, $validated)) {
            $this->orderService->validateApproval($validated);
            $this->orderService->logDiscountActivity($user->id, $validated, '');
        }

        $createdOrders = $this->orderService->createSplitOrders(
            $user, $validated, $orderItems, $groupedTableIds, $session,
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
        abort_if($order->status !== 'pending', 403);

        $validated = $request->validated();
        $user = $request->user();

        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $newSubtotal = array_sum(array_column($orderItems, 'total_price'));

        $discountAmount = $this->orderService->calculateDiscount($newSubtotal, $validated);
        if ($discountAmount > 0 && $this->orderService->needsApproval($newSubtotal, $validated)) {
            $this->orderService->validateApproval($validated);
            $this->orderService->logDiscountActivity($user->id, $validated, ' (confirm pay)');
        }

        $this->orderService->confirmAndFinalizeOrder($order, $validated, $user->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan berhasil dikonfirmasi dan dibayar.']);

        return redirect()->route('pos.index')
            ->with('last_order_id', $order->id);
    }

    public function initiatePayment(InitiatePaymentRequest $request, MidtransService $midtrans): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $subtotal = array_sum(array_column($orderItems, 'total_price'));

        $discountAmount = $this->orderService->calculateDiscount($subtotal, $validated);
        if ($discountAmount > 0 && $this->orderService->needsApproval($subtotal, $validated)) {
            $this->orderService->validateApproval($validated);
        }

        $session = null;
        if ($validated['table_id'] ?? false) {
            $table = Meja::find($validated['table_id']);
            $session = $this->orderService->getOrCreateSession($table);
            $table->update(['status' => 'occupied', 'locked_by' => null]);
        }

        $order = $this->orderService->getOrCreatePaymentOrder($user, $validated, $orderItems, $session);

        $midtransResponse = $midtrans->createCharge(
            (string) $order->id,
            (int) round($order->total),
            $validated['payment_type'],
        );

        $midtransTransactionId = $midtransResponse['transaction_id'] ?? null;
        $paymentData = $this->orderService->extractPaymentResponse($midtransResponse);

        $this->orderService->createPaymentRecord($order, $midtransResponse, $validated['payment_type'], $order->total);

        return response()->json([
            'order_id' => $order->id,
            'order_number' => "TRX-LW-{$order->id}",
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'service_charge' => $order->service_charge,
            'midtrans_charge' => $order->midtrans_charge,
            'total' => $order->total,
            'payment_type' => $validated['payment_type'],
            'transaction_id' => $midtransTransactionId,
            ...$paymentData,
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

        if ($mapped !== 'pending' && $order->payment) {
            $order->payment->update(['status' => $mapped]);

            match ($mapped) {
                'settlement' => tap($order)->update(['status' => 'paid']),
                'failed' => tap($order)->update(['status' => 'cancelled']),
                default => null,
            };

            if ($mapped === 'settlement') {
                broadcast(new OrderPaid($order))->toOthers();
                broadcast(new OrderStatusUpdated($order))->toOthers();
            } elseif ($mapped === 'failed') {
                broadcast(new OrderStatusUpdated($order))->toOthers();
            }
        }

        return response()->json(['status' => $mapped]);
    }

    public function releaseTable(Meja $table): RedirectResponse
    {
        $this->tableService->release($table);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Meja {$table->code} berhasil dikosongkan."]);

        return redirect()->route('pos.index');
    }

    public function lockTable(Request $request, Meja $table): JsonResponse
    {
        if ($table->status !== 'available') {
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
        $this->tableService->unlock($table);

        return response()->json([
            'message' => "Meja {$table->code} tersedia.",
            'table' => $table->fresh()->load('lockedBy'),
        ]);
    }

    public function moveTable(Meja $table, Meja $target): RedirectResponse
    {
        if ($table->status !== 'occupied') {
            Inertia::flash('toast', ['type' => 'error', 'message' => "Meja {$table->code} tidak sedang digunakan."]);

            return redirect()->route('pos.index');
        }

        if ($target->status !== 'available') {
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
        if ($table->status !== 'occupied') {
            Inertia::flash('toast', ['type' => 'error', 'message' => "Meja {$table->code} tidak sedang digunakan."]);

            return redirect()->route('pos.index');
        }

        if ($target->status !== 'occupied') {
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
        abort_if($order->status !== 'pending', 403);

        $this->orderService->updateOrderItems($order, $request->validated()['items']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroyPending(Order $order): RedirectResponse
    {
        abort_if($order->status !== 'pending', 403);

        $this->orderService->cancelPendingOrder($order);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesanan berhasil dibatalkan.']);

        return redirect()->back();
    }
}

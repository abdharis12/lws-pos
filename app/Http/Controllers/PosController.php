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
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\MidtransService;
use App\Services\PaymentService;
use App\Services\PosOrderService;
use App\Services\PosTableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function __construct(
        private readonly PosOrderService $orderService,
        private readonly PosTableService $tableService,
        private readonly ActivityLogService $activityLog,
        private readonly PaymentService $paymentService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = Outlet::first()?->id;

        return Inertia::render('pos/Index', [
            'categories' => $this->categories($outletId),
            'tables' => $this->selectableTables($request, $outletId),
            'pendingOrders' => $this->pendingOrders(),
            'lastOrder' => $this->lastOrder(),
        ]);
    }

    public function tables(Request $request): Response
    {
        $outletId = Outlet::first()?->id;
        $this->viewAnyTable($request);

        $tables = Meja::with('lockedBy')->where('outlet_id', $outletId)->orderBy('code')->get();
        $activeSessions = $this->activeSessions($tables);

        return Inertia::render('pos/Tables', [
            'tables' => $tables,
            'activeSessions' => $activeSessions,
            'groupedTables' => $this->groupedTables($activeSessions),
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::whereIn('status', [OrderStatus::Paid, OrderStatus::Completed])
            ->whereDate('created_at', today())
            ->with(['items.menu', 'items.options.optionItem', 'payment', 'tableSession.table', 'createdBy'])
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json([
            'orders' => $orders->map(fn (Order $order) => [
                'id' => $order->id,
                'order_type' => $order->order_type,
                'status' => $order->status->value,
                'subtotal' => (float) $order->subtotal,
                'tax' => (float) $order->tax,
                'service_charge' => (float) $order->service_charge,
                'midtrans_charge' => (float) ($order->midtrans_charge ?? 0),
                'rounding_amount' => (float) ($order->rounding_amount ?? 0),
                'discount' => (float) $order->discount,
                'discount_type' => $order->discount_type,
                'discount_value' => $order->discount_value !== null ? (float) $order->discount_value : null,
                'total' => (float) $order->total,
                'customer_name' => $order->customer_name,
                'created_at' => $order->created_at->toIso8601String(),
                'created_by' => $order->createdBy ? ['id' => $order->createdBy->id, 'name' => $order->createdBy->name] : null,
                'table_session' => $order->tableSession ? ['table' => ['code' => $order->tableSession->table?->code]] : null,
                'grouped_tables' => $order->grouped_tables,
                'payment' => $order->payment ? ['method' => $order->payment->method] : null,
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'qty' => $item->qty,
                    'base_price' => (float) $item->base_price,
                    'total_price' => (float) $item->total_price,
                    'notes' => $item->notes,
                    'menu' => ['name' => $item->menu->name, 'price' => (float) $item->menu->price],
                    'options' => $item->options->map(fn ($opt) => [
                        'price_adjustment' => (float) $opt->price_adjustment,
                        'option_item' => ['name' => $opt->optionItem->name, 'price_adjustment' => (float) $opt->optionItem->price_adjustment],
                    ])->all(),
                ])->all(),
            ])->all(),
        ]);
    }

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $posSessionId = $this->currentPosSessionId();
        [$session, $groupedTableIds] = $this->prepareTables($request, $validated, true);

        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $this->logLargeIfNeeded($this->orderSubtotal($orderItems), $validated, $user);

        $createdOrders = $this->orderService->createSplitOrders(
            $user, $validated, $orderItems, $groupedTableIds, $session, $posSessionId,
        );

        $firstOrder = $createdOrders[0] ?? null;
        $splitCount = (int) ($validated['split_count'] ?? 1);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $splitCount > 1 ? "Pesanan berhasil dibuat ({$splitCount} bill)." : 'Pesanan berhasil dibuat.',
        ]);

        return redirect()->route('pos.index')->with('last_order_id', $firstOrder?->id);
    }

    public function confirmPay(ConfirmPayRequest $request, Order $order): RedirectResponse
    {
        $this->authorize('update', $order);
        abort_if($order->status !== OrderStatus::Pending, 403);

        $validated = $request->validated();
        $user = $request->user();
        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $newSubtotal = $this->orderSubtotal($orderItems);

        if ($this->needsApproval($newSubtotal, $validated)) {
            $this->orderService->validateApproval($validated);
            $this->logLargeDiscount($user, $newSubtotal, $validated, ' (confirm pay)', $order->id);
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
            $this->validateLargeApproval($this->orderSubtotal($orderItems), $validated);

            [$session] = $this->prepareTables($request, $validated);
            $order = $this->orderService->getOrCreatePaymentOrder(
                $user, $validated, $orderItems, $session, $this->currentPosSessionId(),
            );

            return $this->midtransInitiatedResponse($order, $validated, $midtrans);
        } catch (\Exception $e) {
            Log::error('Payment initiation failed', [
                'message' => $e->getMessage(),
                'user_id' => $request->user()?->id,
                'payment_type' => $request->validated('payment_type'),
            ]);

            return response()->json(['message' => 'Gagal memproses pembayaran. Silakan coba lagi.'], 500);
        }
    }

    public function qrisStatus(Order $order, MidtransService $midtrans): JsonResponse
    {
        $this->authorize('view', $order);

        if ($order->status === OrderStatus::Paid) {
            return response()->json(['status' => 'settlement']);
        }

        $mapped = $this->mapStatus($order, $midtrans);

        if ($mapped !== 'pending' && $order->payment) {
            $order->payment->update(['status' => $mapped]);
            $this->applyOrderStatus($order, $mapped);
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

        if (! $this->isAvailable($table)) {
            return response()->json(['message' => "Meja {$table->code} tidak tersedia."], 422);
        }

        $this->tableService->lock($table, $request->user()->id);

        return response()->json(['message' => "Meja {$table->code} terkunci.", 'table' => $table->fresh()->load('lockedBy')]);
    }

    public function unlockTable(Meja $table): JsonResponse
    {
        $this->authorize('update', $table);
        $this->tableService->unlock($table);

        return response()->json(['message' => "Meja {$table->code} tersedia.", 'table' => $table->fresh()->load('lockedBy')]);
    }

    public function moveTable(Meja $table, Meja $target): RedirectResponse
    {
        $this->authorize('update', $table);
        $this->authorize('update', $target);

        if (! $this->isOccupied($table)) {
            return $this->tableError("Meja {$table->code} tidak sedang digunakan.");
        }

        if (! $this->isAvailable($target)) {
            return $this->tableError("Meja {$target->code} sedang digunakan.");
        }

        if (! $this->hasActiveSession($table)) {
            return $this->tableError("Tidak ada sesi aktif untuk meja {$table->code}.");
        }

        $this->tableService->move($table, $target);
        Inertia::flash('toast', ['type' => 'success', 'message' => "Meja {$table->code} dipindah ke Meja {$target->code}."]);

        return redirect()->route('pos.index');
    }

    public function mergeTable(Meja $table, Meja $target): RedirectResponse
    {
        $this->authorize('update', $table);
        $this->authorize('update', $target);

        if (! $this->isOccupied($table) || ! $this->isOccupied($target)) {
            return $this->tableError('Salah satu meja tidak sedang digunakan.');
        }

        if (! $this->hasActiveSession($table) || ! $this->hasActiveSession($target)) {
            return $this->tableError('Sesi meja tidak ditemukan.');
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

    public function cancelPayment(Request $request, Order $order, MidtransService $midtrans): RedirectResponse
    {
        $this->authorize('update', $order);
        abort_if(! in_array($order->status, [OrderStatus::Pending, OrderStatus::PendingPayment], true), 403);

        $this->orderService->voidMidtransPayment($order, $midtrans);
        $this->markOrderFailed($order);

        $this->activityLog->log(
            $request->user(),
            'payment.cancelled',
            'order',
            $order->id,
            "Pembayaran online Order #{$order->id} dibatalkan.",
            ['method' => $order->payment?->method],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran berhasil dibatalkan.']);

        return redirect()->back();
    }

    // ── index helpers ───────────────────────────────────────────────────────

    protected function categories(?int $outletId): Collection
    {
        return MenuCategory::where('outlet_id', $outletId)
            ->where('is_active', true)
            ->with(['menus' => fn ($q) => $q->with('optionGroups.optionItems')])
            ->orderBy('sort_order')
            ->get();
    }

    protected function selectableTables(Request $request, ?int $outletId): Collection
    {
        $userId = $request->user()->id;

        return Meja::with('lockedBy')
            ->where('outlet_id', $outletId)
            ->where(function ($query) use ($userId) {
                $query->where('status', TableStatus::Available)
                    ->orWhere(fn ($q) => $q->where('status', TableStatus::Locked)->where('locked_by', $userId));
            })
            ->orderBy('code')
            ->get();
    }

    protected function pendingOrders(): Collection
    {
        return Order::whereIn('status', [OrderStatus::Pending, OrderStatus::PendingPayment])
            ->with(['tableSession.table', 'items.menu', 'items.options.optionItem', 'payment'])
            ->orderByDesc('created_at')
            ->get();
    }

    protected function viewAnyTable(Request $request): void
    {
        $this->authorize('viewAny', Meja::class);
    }

    protected function activeSessions(Collection $tables): Collection
    {
        return TableSession::whereIn('table_id', $tables->pluck('id'))
            ->where('status', 'active')
            ->with(['table', 'orders' => fn ($q) => $q->with(['items', 'payment'])])
            ->get();
    }

    protected function groupedTables(Collection $sessions): array
    {
        return $sessions
            ->mapWithKeys(fn ($session) => [
                $session->table_id => $session->orders->firstWhere('grouped_tables')?->grouped_tables ?? null,
            ])
            ->filter()
            ->toArray();
    }

    protected function lastOrder(): ?Order
    {
        $id = session('last_order_id');

        return $id
            ? Order::with(['items.menu', 'items.options.optionItem', 'payment', 'tableSession.table', 'createdBy'])->find($id)
            : null;
    }

    // ── order helpers ───────────────────────────────────────────────────────

    protected function currentPosSessionId(): ?int
    {
        $outlet = Outlet::first();

        if (! $outlet) {
            return null;
        }

        return PosSession::where('outlet_id', $outlet->id)
            ->whereDate('session_date', today())
            ->where('status', 'open')
            ->first()?->id;
    }

    protected function prepareTables(Request $request, array $validated, bool $occupy = false): array
    {
        $session = null;
        $groupedTableIds = [];

        if (! ($validated['table_id'] ?? false)) {
            return [$session, $groupedTableIds];
        }

        $table = Meja::find($validated['table_id']);
        $this->authorize('create', [Order::class, $table]);
        $this->ensureTableSelectable($request, $table);
        $session = $this->orderService->getOrCreateSession($table);

        if ($occupy) {
            $table->update(['status' => TableStatus::Occupied, 'locked_by' => null]);
        }

        if (! empty($validated['table_ids'])) {
            $groupedTableIds = $this->orderService->prepareGroupedTables($validated['table_ids'], $validated['table_id']);

            if ($occupy && ! empty($groupedTableIds)) {
                Meja::whereIn('id', $groupedTableIds)->update(['status' => TableStatus::Occupied]);
            }
        }

        return [$session, $groupedTableIds];
    }

    protected function orderSubtotal(array $orderItems): float
    {
        return (float) array_sum(array_column($orderItems, 'total_price'));
    }

    protected function needsApproval(float $subtotal, array $validated): bool
    {
        return $this->orderService->needsApproval($subtotal, $validated);
    }

    protected function validateLargeApproval(float $subtotal, array $validated): void
    {
        if ($this->needsApproval($subtotal, $validated)) {
            $this->orderService->validateApproval($validated);
        }
    }

    protected function logLargeIfNeeded(float $subtotal, array $validated, User $user): void
    {
        if ($this->needsApproval($subtotal, $validated)) {
            $this->orderService->validateApproval($validated);
            $this->logLargeDiscount($user, $subtotal, $validated);
        }
    }

    protected function logLargeDiscount(User $user, float $subtotal, array $validated, string $label = '', ?int $orderId = null): void
    {
        $this->activityLog->log(
            $user, 'large_discount', 'order', $orderId,
            "Diskon besar diterapkan ({$label}): ".($validated['discount_type'] ?? '').' '.($validated['discount_value'] ?? ''),
            $validated,
        );
    }

    // ── payment / qris helpers ──────────────────────────────────────────────

    protected function midtransInitiatedResponse(Order $order, array $validated, MidtransService $midtrans): JsonResponse
    {
        $midtransResponse = $midtrans->createCharge(
            (string) $order->id,
            (int) round((float) $order->total),
            $validated['payment_type'],
        );

        $paymentData = $this->paymentService->extractPaymentResponse($midtransResponse);
        $this->paymentService->createPaymentRecord($order, $midtransResponse, $validated['payment_type'], (float) $order->total);

        return response()->json([
            'order_id' => $order->id,
            'order_number' => config('pos.order_number_prefix', 'TRX-LW-').$order->id,
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'service_charge' => $order->service_charge,
            'midtrans_charge' => $order->midtrans_charge,
            'rounding_amount' => $order->rounding_amount,
            'total' => $order->total,
            'payment_type' => $validated['payment_type'],
            'transaction_id' => $midtransResponse['transaction_id'] ?? null,
            ...$paymentData,
        ]);
    }

    protected function mapStatus(Order $order, MidtransService $midtrans): string
    {
        $status = $midtrans->getTransactionStatus((string) $order->id)['transaction_status'] ?? 'unknown';

        return match ($status) {
            'capture', 'settlement' => 'settlement',
            'pending' => 'pending',
            'expire', 'cancel', 'deny' => 'failed',
            default => 'pending',
        };
    }

    protected function applyOrderStatus(Order $order, string $mapped): void
    {
        if ($mapped === 'settlement') {
            $this->markOrderPaid($order);
        } elseif ($mapped === 'failed') {
            $this->markOrderFailed($order);
        }
    }

    protected function markOrderPaid(Order $order): void
    {
        $updated = Order::where('id', $order->id)
            ->where('status', '!=', OrderStatus::Paid->value)
            ->update(['status' => OrderStatus::Paid->value]);

        if (! $updated) {
            return;
        }

        $order->refresh();
        broadcast(new OrderPaid($order))->toOthers();
        broadcast(new OrderStatusUpdated($order))->toOthers();

        if ($order->tableSession?->table) {
            $order->tableSession->table->update(['status' => TableStatus::Occupied, 'locked_by' => null]);
        }
    }

    protected function markOrderFailed(Order $order): void
    {
        $order->update(['status' => OrderStatus::Cancelled]);
        $order->refresh();
        broadcast(new OrderStatusUpdated($order))->toOthers();

        if ($order->tableSession?->table && ! $order->tableSession->orders()->whereIn('status', [
            OrderStatus::Paid->value, OrderStatus::Processing->value, OrderStatus::Ready->value,
        ])->exists()) {
            $order->tableSession->table->update(['status' => TableStatus::Available, 'locked_by' => null]);
        }
    }

    protected function isAvailable(Meja $table): bool
    {
        return $table->status === TableStatus::Available;
    }

    protected function ensureTableSelectable(Request $request, Meja $table): void
    {
        $selectable = $this->isAvailable($table)
            || ($table->status === TableStatus::Locked && $table->locked_by === $request->user()->id);

        if (! $selectable) {
            throw ValidationException::withMessages([
                'table_id' => "Meja {$table->code} tidak tersedia untuk pesanan baru.",
            ]);
        }
    }

    protected function isOccupied(Meja $table): bool
    {
        return $table->status === TableStatus::Occupied;
    }

    protected function hasActiveSession(Meja $table): bool
    {
        return $table->sessions()->where('status', 'active')->exists();
    }

    protected function tableError(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'error', 'message' => $message]);

        return redirect()->route('pos.index');
    }
}

<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\TableStatus;
use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Http\Requests\SelfOrder\PayRequest;
use App\Http\Requests\SelfOrder\StoreRequest;
use App\Models\Meja;
use App\Models\Order;
use App\Models\QrCode;
use App\Models\TableSession;
use App\Services\MenuCatalogService;
use App\Services\PaymentService;
use App\Services\SelfOrderPaymentExpiryService;
use App\Services\SelfOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SelfOrderController extends Controller
{
    public function __construct(
        private readonly SelfOrderService $orderService,
        private readonly PaymentService $paymentService,
        private readonly MenuCatalogService $menuCatalog,
    ) {}

    public function show(string $tableToken): Response
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        $outlet = $table->outlet;
        $categories = collect($this->menuCatalog->getForOutlet($outlet->id))
            ->map(function (array $category) {
                $category['menus'] = collect($category['menus'] ?? [])
                    ->where('is_available', true)
                    ->values()
                    ->all();

                return $category;
            })
            ->values()
            ->all();

        return Inertia::render('self-order/Menu', [
            'table' => $table,
            'tableToken' => $tableToken,
            'categories' => $categories,
            'outlet' => $outlet,
        ]);
    }

    public function store(StoreRequest $request, string $tableToken): RedirectResponse
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        $validated = $request->validated();
        $validated['idempotency_key'] ??= (string) Str::uuid();
        $payloadHash = $this->idempotencyPayloadHash($validated, 'cash');

        [$order, $wasCreated] = DB::transaction(function () use ($table, $validated, $payloadHash, $request): array {
            $lockedTable = Meja::query()->lockForUpdate()->findOrFail($table->id);
            $existingOrder = Order::query()
                ->where('idempotency_key', $validated['idempotency_key'])
                ->first();

            if ($existingOrder) {
                abort_unless(
                    hash_equals((string) $existingOrder->idempotency_payload_hash, $payloadHash)
                    && $existingOrder->tableSession?->table_id === $lockedTable->id,
                    409,
                    'Kunci checkout sudah digunakan untuk pesanan lain. Silakan mulai ulang checkout.',
                );

                $this->authorizeOrderSession($request, $existingOrder);

                return [$existingOrder, false];
            }

            $session = $this->orderService->getOrCreateSession($lockedTable);
            $order = $this->buildOrder($session, $validated, 'cash', OrderStatus::Pending);
            $order->forceFill([
                'idempotency_key' => $validated['idempotency_key'],
                'idempotency_payload_hash' => $payloadHash,
            ])->save();
            $this->authorizeOrderSession($request, $order);

            return [$order, true];
        });

        if ($wasCreated) {
            $order->refresh();
            broadcast(new OrderCreated($order))->toOthers();
            broadcast(new OrderStatusUpdated($order))->toOthers();
        }

        return redirect()->route('self-order.status', [$tableToken, $order]);
    }

    public function pay(PayRequest $request, string $tableToken): JsonResponse
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        $validated = $request->validated();
        $qrCode = null;
        $existingOrder = Order::query()
            ->where('idempotency_key', $validated['idempotency_key'])
            ->first();

        if ($validated['payment_method'] === 'online' && ! $existingOrder) {
            $qrCode = QrCode::activeQr();

            if (! $qrCode || blank($qrCode->image_path)) {
                return response()->json(['message' => 'QRIS belum dikonfigurasi. Silakan bayar di kasir.'], 422);
            }
        }

        $status = $validated['payment_method'] === 'online' ? OrderStatus::PendingPayment : OrderStatus::Pending;
        $payloadHash = $this->idempotencyPayloadHash($validated, $validated['payment_method']);
        $expiresAt = $validated['payment_method'] === 'online'
            ? now()->addMinutes(max(1, (int) config('pos.self_order_qr_expiry_minutes', 15)))
            : null;

        [$order, $isExpiredReplay, $wasCreated] = DB::transaction(function () use ($table, $validated, $status, $payloadHash, $expiresAt, $qrCode, $request): array {
            $lockedTable = Meja::query()->lockForUpdate()->findOrFail($table->id);
            $existingOrder = Order::query()
                ->where('idempotency_key', $validated['idempotency_key'])
                ->first();

            if ($existingOrder) {
                abort_unless(
                    hash_equals((string) $existingOrder->idempotency_payload_hash, $payloadHash)
                    && $existingOrder->tableSession?->table_id === $lockedTable->id,
                    409,
                    'Kunci checkout sudah digunakan untuk pesanan lain. Silakan mulai ulang checkout.',
                );

                $this->authorizeOrderSession($request, $existingOrder);

                $isExpiredPendingPayment = $existingOrder->status === OrderStatus::PendingPayment
                    && ($existingOrder->payment_expires_at?->isPast() ?? false);

                return [$existingOrder, $isExpiredPendingPayment, false];
            }

            $session = $this->orderService->getOrCreateSession($lockedTable);
            $order = $this->buildOrder($session, $validated, $validated['payment_method'], $status);
            $order->forceFill([
                'idempotency_key' => $validated['idempotency_key'],
                'idempotency_payload_hash' => $payloadHash,
                'payment_expires_at' => $expiresAt,
                'payment_qr_code_path' => $qrCode?->image_path,
            ])->save();

            if ($validated['payment_method'] === 'online') {
                $this->paymentService->createPaymentRecord($order, [], 'qris');
            }

            $this->authorizeOrderSession($request, $order);

            return [$order, false, true];
        });

        if ($wasCreated) {
            $order->refresh();
            broadcast(new OrderCreated($order))->toOthers();
            broadcast(new OrderStatusUpdated($order))->toOthers();
        }

        if ($isExpiredReplay) {
            app(SelfOrderPaymentExpiryService::class)->expire($order);

            return response()->json([
                'code' => 'payment_expired',
                'message' => 'Batas waktu QRIS telah berakhir. Silakan mulai pembayaran baru.',
            ], 409);
        }

        if ($order->status === OrderStatus::Cancelled) {
            return response()->json([
                'code' => 'order_cancelled',
                'message' => 'Pesanan ini sudah dibatalkan. Silakan mulai pembayaran baru.',
            ], 409);
        }

        $orderNumber = config('pos.order_number_prefix', 'TRX-LW-').$order->id;

        if ($validated['payment_method'] === 'online') {
            return $this->payOnline($order, $orderNumber);
        }

        return response()->json([
            'order_id' => $order->id,
            'order_number' => $orderNumber,
            'access_token' => $order->access_token,
            'status' => 'pending',
            'rounding_amount' => (float) $order->rounding_amount,
            'total' => (float) $order->total,
        ]);
    }

    public function paymentStatus(string $tableToken, Order $order, Request $request, SelfOrderPaymentExpiryService $expiryService): JsonResponse
    {
        $this->assertOrderAccess($tableToken, $order, $request);

        if ($order->payment_expires_at?->isPast()) {
            $expiryService->expire($order);
            $order->refresh();
        }

        if (in_array($order->status, [
            OrderStatus::Paid,
            OrderStatus::Processing,
            OrderStatus::Processed,
            OrderStatus::Ready,
            OrderStatus::Completed,
        ], true)) {
            return response()->json(['status' => 'settlement']);
        }

        if ($order->status === OrderStatus::Cancelled) {
            return response()->json(['status' => 'failed']);
        }

        return response()->json(['status' => 'pending']);
    }

    public function cancel(string $tableToken, Order $order, Request $request): JsonResponse
    {
        $this->assertTableOwner($tableToken, $order);
        $this->assertOrderToken($order, (string) $request->input('access_token'));
        abort_if(! in_array($order->status, [OrderStatus::Pending, OrderStatus::PendingPayment], true), 403);

        if ($order->payment) {
            $order->payment->update(['status' => 'failed']);
        }

        $order->update(['status' => OrderStatus::Cancelled]);
        $order->refresh();
        broadcast(new OrderStatusUpdated($order))->toOthers();

        $session = $order->tableSession;
        if ($session && ! $session->orders()
            ->where('id', '!=', $order->id)
            ->whereIn('status', [
                OrderStatus::Pending->value,
                OrderStatus::PendingPayment->value,
                OrderStatus::Paid->value,
                OrderStatus::Processing->value,
                OrderStatus::Processed->value,
                OrderStatus::Ready->value,
            ])->exists()) {
            $session->update(['status' => 'closed', 'closed_at' => now()]);

            if ($session->table) {
                $session->table->update(['status' => TableStatus::Available, 'locked_by' => null]);
            }
        }

        return response()->json(['status' => 'cancelled']);
    }

    public function orderStatus(string $tableToken, Order $order, Request $request): Response
    {
        $this->assertOrderAccess($tableToken, $order, $request);
        $order->load(['items.menu', 'items.options.optionItem', 'tableSession.table']);

        return Inertia::render('self-order/Status', [
            'table' => $order->tableSession->table,
            'tableToken' => $tableToken,
            'statusChannelToken' => $this->statusChannelToken($order),
            'order' => $order->only(['id', 'status', 'total', 'items', 'subtotal', 'tax', 'service_charge', 'midtrans_charge', 'rounding_amount', 'discount', 'order_type', 'customer_name', 'created_at', 'access_token']),
        ]);
    }

    public function thankYou(string $tableToken, Order $order, Request $request): Response
    {
        $this->assertOrderAccess($tableToken, $order, $request);
        $order->load(['items.menu', 'items.options.optionItem', 'tableSession.table', 'servedBy']);

        return Inertia::render('self-order/ThankYou', [
            'table' => $order->tableSession->table,
            'tableToken' => $tableToken,
            'statusChannelToken' => $this->statusChannelToken($order),
            'order' => $order,
        ]);
    }

    public function pollStatus(string $tableToken, Order $order, Request $request, SelfOrderPaymentExpiryService $expiryService): JsonResponse
    {
        $this->assertOrderAccess($tableToken, $order, $request);

        if ($order->payment_expires_at?->isPast()) {
            $expiryService->expire($order);
            $order->refresh();
        }
        $order->load(['items.menu', 'items.options.optionItem', 'tableSession.table']);

        return response()->json([
            'id' => $order->id,
            'status' => $order->status->value,
            'items' => $order->items->map(fn ($item) => [
                'id' => $item->id,
                'menu' => ['name' => $item->menu->name],
                'qty' => $item->qty,
                'notes' => $item->notes,
                'options' => $item->options->map(fn ($opt) => [
                    'quantity' => $opt->quantity,
                    'option_item' => ['name' => $opt->optionItem?->name ?? ''],
                ]),
            ]),
            'subtotal' => (float) $order->subtotal,
            'tax' => (float) $order->tax,
            'rounding_amount' => (float) ($order->rounding_amount ?? 0),
            'total' => (float) $order->total,
        ]);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    protected function buildOrder(TableSession $session, array $validated, string $paymentMethod, OrderStatus $status): Order
    {
        $orderItems = $this->orderService->buildOrderItemsForOutlet($validated['items'], $session->table->outlet_id);

        $order = $this->orderService->buildOrderServerSide(
            $session,
            $validated['customer_name'] ?? null,
            'dine_in_qr',
            $status,
            $orderItems,
            $paymentMethod,
        );

        $this->orderService->attachOrderItems($order, $orderItems);

        return $order;
    }

    protected function payOnline(Order $order, string $orderNumber): JsonResponse
    {
        $paymentStatus = in_array($order->status, [
            OrderStatus::Paid,
            OrderStatus::Processing,
            OrderStatus::Processed,
            OrderStatus::Ready,
            OrderStatus::Completed,
        ], true) ? 'settlement' : 'pending';

        return response()->json([
            'order_id' => $order->id,
            'order_number' => $orderNumber,
            'access_token' => $order->access_token,
            'subtotal' => (float) $order->subtotal,
            'tax' => (float) $order->tax,
            'service_charge' => (float) ($order->service_charge ?? 0),
            'midtrans_charge' => (float) ($order->midtrans_charge ?? 0),
            'rounding_amount' => (float) ($order->rounding_amount ?? 0),
            'total' => (float) $order->total,
            'payment_type' => 'qris',
            'transaction_id' => null,
            'qr_code' => $order->payment_qr_code_path ? '/storage/'.ltrim($order->payment_qr_code_path, '/') : null,
            'manual_qr' => true,
            'status' => $paymentStatus,
            'payment_expires_at' => $order->payment_expires_at?->toIso8601String(),
        ]);
    }

    protected function idempotencyPayloadHash(array $validated, string $paymentMethod): string
    {
        $payload = [
            'customer_name' => trim($validated['customer_name']),
            'payment_method' => $paymentMethod,
            'payment_type' => $validated['payment_type'] ?? null,
            'items' => array_map(fn (array $item): array => [
                'menu_id' => (int) $item['menu_id'],
                'qty' => (int) $item['qty'],
                'notes' => $item['notes'] ?? null,
                'option_ids' => array_map('intval', $item['option_ids'] ?? []),
            ], $validated['items']),
        ];

        return hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
    }

    protected function authorizeOrderSession(Request $request, Order $order): void
    {
        $authorizedOrders = $request->session()->get('self_order.authorized_orders', []);
        $authorizedOrders[$order->id] = true;
        $request->session()->put('self_order.authorized_orders', array_slice($authorizedOrders, -50, null, true));
    }

    protected function statusChannelToken(Order $order): string
    {
        return hash_hmac('sha256', (string) $order->access_token, (string) config('app.key'));
    }

    protected function assertOrderAccess(string $tableToken, Order $order, Request $request): void
    {
        $this->assertTableOwner($tableToken, $order);
        abort_unless($request->session()->get('self_order.authorized_orders.'.$order->id) === true, 404);
    }

    protected function assertTableOwner(string $tableToken, Order $order): void
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        abort_if($order->tableSession?->table_id !== $table->id, 404);
    }

    protected function assertOrderToken(Order $order, string $token): void
    {
        abort_if(
            blank($order->access_token) || ! hash_equals($order->access_token, $token),
            403,
        );
    }
}

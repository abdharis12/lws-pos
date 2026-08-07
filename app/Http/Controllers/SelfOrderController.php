<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\TableStatus;
use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Http\Requests\SelfOrder\PayRequest;
use App\Http\Requests\SelfOrder\StoreRequest;
use App\Models\Meja;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\TableSession;
use App\Services\MidtransService;
use App\Services\PaymentService;
use App\Services\SelfOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SelfOrderController extends Controller
{
    public function __construct(
        private readonly SelfOrderService $orderService,
        private readonly PaymentService $paymentService,
    ) {}

    public function show(string $tableToken): Response
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        $outlet = $table->outlet;
        $categories = MenuCategory::where('outlet_id', $outlet->id)
            ->where('is_active', true)
            ->with(['menus' => fn ($q) => $q->where('is_available', true)->with('optionGroups.optionItems')])
            ->orderBy('sort_order')
            ->get();

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
        $session = $this->orderService->getOrCreateSession($table);
        $validated = $request->validated();

        $order = $this->buildOrder($session, $validated, 'cash', OrderStatus::Pending);

        $order->refresh();
        broadcast(new OrderCreated($order))->toOthers();
        broadcast(new OrderStatusUpdated($order))->toOthers();

        return redirect()->route('self-order.status', [$tableToken, $order]);
    }

    public function pay(PayRequest $request, string $tableToken, MidtransService $midtrans): JsonResponse
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        $session = $this->orderService->getOrCreateSession($table);
        $validated = $request->validated();
        $status = $validated['payment_method'] === 'online' ? OrderStatus::PendingPayment : OrderStatus::Pending;

        $order = $this->buildOrder($session, $validated, $validated['payment_method'], $status);
        $orderNumber = config('pos.order_number_prefix', 'TRX-LW-').$order->id;

        if ($validated['payment_method'] === 'online') {
            return $this->payOnline($order, $validated, $midtrans, $orderNumber);
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

    public function paymentStatus(Order $order, MidtransService $midtrans): JsonResponse
    {
        if ($order->status === OrderStatus::Paid) {
            return response()->json(['status' => 'settlement']);
        }

        if ($order->status === OrderStatus::Cancelled) {
            return response()->json(['status' => 'failed']);
        }

        $mapped = $this->mapStatus($order, $midtrans);

        if ($mapped !== 'pending' && $order->payment) {
            $order->payment->update(['status' => $mapped]);
            $this->applyFinalStatus($order, $mapped);
        }

        return response()->json(['status' => $mapped]);
    }

    public function cancel(string $tableToken, Order $order, Request $request, MidtransService $midtrans): JsonResponse
    {
        $this->assertTableOwner($tableToken, $order);
        $this->assertOrderToken($order, (string) $request->input('access_token'));
        abort_if(! in_array($order->status, [OrderStatus::Pending, OrderStatus::PendingPayment], true), 403);

        if ($order->payment) {
            $midtrans->cancel((string) $order->id);
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
                OrderStatus::Ready->value,
            ])->exists()) {
            $session->update(['status' => 'closed', 'closed_at' => now()]);

            if ($session->table) {
                $session->table->update(['status' => TableStatus::Available, 'locked_by' => null]);
            }
        }

        return response()->json(['status' => 'cancelled']);
    }

    public function orderStatus(string $tableToken, Order $order): Response
    {
        $this->assertTableOwner($tableToken, $order);
        $order->load(['items.menu', 'items.options.optionItem']);

        return Inertia::render('self-order/Status', [
            'table' => $order->tableSession->table,
            'tableToken' => $tableToken,
            'order' => [...$order->toArray(), 'access_token' => $order->access_token],
        ]);
    }

    public function thankYou(string $tableToken, Order $order): Response
    {
        $this->assertTableOwner($tableToken, $order);
        $order->load(['items.menu', 'items.options.optionItem', 'servedBy']);

        return Inertia::render('self-order/ThankYou', [
            'table' => $order->tableSession->table,
            'tableToken' => $tableToken,
            'order' => $order,
        ]);
    }

    public function pollStatus(string $tableToken, Order $order): JsonResponse
    {
        $this->assertTableOwner($tableToken, $order);
        $order->load(['items.menu', 'items.options.optionItem']);

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
        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $subtotal = array_sum(array_column($orderItems, 'total_price'));
        $totals = $this->orderService->calculateTotals($subtotal, $paymentMethod);

        $order = $this->orderService->createOrder(
            $session,
            $validated['customer_name'] ?? null,
            'dine_in_qr',
            $status,
            $subtotal,
            $totals['tax'],
            $totals['serviceCharge'],
            $totals['midtransCharge'],
            $totals['total'],
            $totals['roundingAmount'] ?? 0,
        );

        $this->orderService->attachOrderItems($order, $orderItems);

        return $order;
    }

    protected function payOnline(Order $order, array $validated, MidtransService $midtrans, string $orderNumber): JsonResponse
    {
        $paymentType = $validated['payment_type'];
        $midtransResponse = $midtrans->createCharge((string) $order->id, (int) round((float) $order->total), $paymentType);
        $paymentData = $this->paymentService->extractPaymentResponse($midtransResponse);

        $this->paymentService->createPaymentRecord($order, $midtransResponse, $paymentType, (float) $order->total);

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
            'payment_type' => $paymentType,
            'transaction_id' => $midtransResponse['transaction_id'] ?? null,
            ...$paymentData,
        ]);
    }

    protected function mapStatus(Order $order, MidtransService $midtrans): string
    {
        $status = $midtrans->getTransactionStatus((string) $order->id)['transaction_status'] ?? 'unknown';

        return match ($status) {
            'capture', 'settlement' => 'settlement',
            'expire', 'cancel', 'deny' => 'failed',
            default => 'pending',
        };
    }

    protected function applyFinalStatus(Order $order, string $mapped): void
    {
        if ($mapped === 'settlement') {
            $updated = Order::where('id', $order->id)
                ->where('status', '!=', OrderStatus::Paid->value)
                ->update(['status' => OrderStatus::Paid->value]);

            if ($updated) {
                $order->refresh();
                broadcast(new OrderPaid($order))->toOthers();
                broadcast(new OrderStatusUpdated($order))->toOthers();
            }
        } elseif ($mapped === 'failed') {
            $order->update(['status' => OrderStatus::Cancelled]);
            $order->refresh();
            broadcast(new OrderStatusUpdated($order))->toOthers();
        }
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

<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Http\Requests\SelfOrder\PayRequest;
use App\Http\Requests\SelfOrder\StoreRequest;
use App\Models\Meja;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Services\MidtransService;
use App\Services\PaymentService;
use App\Services\SelfOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
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
        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $subtotal = array_sum(array_column($orderItems, 'total_price'));
        $totals = $this->orderService->calculateTotals($subtotal, 'cash');

        $order = $this->orderService->createOrder(
            $session,
            $validated['customer_name'] ?? null,
            'dine_in_qr',
            OrderStatus::Pending,
            $subtotal,
            $totals['tax'],
            $totals['serviceCharge'],
            $totals['midtransCharge'],
            $totals['total'],
        );

        $this->orderService->attachOrderItems($order, $orderItems);

        broadcast(new OrderCreated($order))->toOthers();
        broadcast(new OrderStatusUpdated($order))->toOthers();

        return redirect()->route('self-order.status', [$tableToken, $order]);
    }

    public function pay(PayRequest $request, string $tableToken, MidtransService $midtrans): JsonResponse
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        $session = $this->orderService->getOrCreateSession($table);

        $validated = $request->validated();
        $paymentMethod = $validated['payment_method'];

        $orderItems = $this->orderService->buildOrderItems($validated['items']);
        $subtotal = array_sum(array_column($orderItems, 'total_price'));
        $totals = $this->orderService->calculateTotals($subtotal, $paymentMethod);

        $status = $paymentMethod === 'online' ? OrderStatus::PendingPayment : OrderStatus::Pending;

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
        );

        $this->orderService->attachOrderItems($order, $orderItems);

        broadcast(new OrderCreated($order))->toOthers();
        broadcast(new OrderStatusUpdated($order))->toOthers();

        $orderNumber = config('pos.order_number_prefix', 'TRX-LW-').$order->id;

        if ($paymentMethod === 'online') {
            $paymentType = $validated['payment_type'];
            $midtransResponse = $midtrans->createCharge((string) $order->id, (int) round($totals['total']), $paymentType);
            $paymentData = $this->paymentService->extractPaymentResponse($midtransResponse);

            $this->paymentService->createPaymentRecord($order, $midtransResponse, $paymentType, $totals['total']);

            return response()->json([
                'order_id' => $order->id,
                'order_number' => $orderNumber,
                'subtotal' => $subtotal,
                'tax' => $totals['tax'],
                'service_charge' => $totals['serviceCharge'],
                'midtrans_charge' => $totals['midtransCharge'],
                'total' => $totals['total'],
                'payment_type' => $paymentType,
                'transaction_id' => $midtransResponse['transaction_id'] ?? null,
                ...$paymentData,
            ]);
        }

        return response()->json([
            'order_id' => $order->id,
            'order_number' => $orderNumber,
            'status' => 'pending',
            'total' => $totals['total'],
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
                broadcast(new OrderStatusUpdated($order))->toOthers();
            }
        }

        return response()->json(['status' => $mapped]);
    }

    public function orderStatus(string $tableToken, Order $order): Response
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        abort_if($order->tableSession?->table_id !== $table->id, 404);

        $order->load(['items.menu', 'items.options.optionItem']);

        return Inertia::render('self-order/Status', [
            'table' => $table,
            'tableToken' => $tableToken,
            'order' => $order,
        ]);
    }

    public function pollStatus(string $tableToken, Order $order): JsonResponse
    {
        $table = Meja::where('table_token', $tableToken)->firstOrFail();
        abort_if($order->tableSession?->table_id !== $table->id, 404);

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
            'total' => (float) $order->total,
        ]);
    }
}

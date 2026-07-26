<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Http\Requests\SelfOrder\PayRequest;
use App\Http\Requests\SelfOrder\StoreRequest;
use App\Models\Meja;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Services\MidtransService;
use App\Services\SelfOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SelfOrderController extends Controller
{
    public function __construct(
        private readonly SelfOrderService $orderService,
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
            $session, $validated['customer_name'],
            'dine_in_qr', 'pending',
            $subtotal, $totals['tax'], $totals['serviceCharge'], $totals['midtransCharge'], $totals['total'],
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

        $status = $paymentMethod === 'online' ? 'pending_payment' : 'pending';

        $order = $this->orderService->createOrder(
            $session, $validated['customer_name'],
            'dine_in_qr', $status,
            $subtotal, $totals['tax'], $totals['serviceCharge'], $totals['midtransCharge'], $totals['total'],
        );

        $this->orderService->attachOrderItems($order, $orderItems);

        broadcast(new OrderCreated($order))->toOthers();
        broadcast(new OrderStatusUpdated($order))->toOthers();

        if ($paymentMethod === 'online') {
            $paymentType = $validated['payment_type'];
            $midtransResponse = $midtrans->createCharge((string) $order->id, $totals['total'], $paymentType);
            $paymentData = $this->orderService->extractPaymentResponse($midtransResponse);

            $this->orderService->createPayment($order, $midtransResponse, $paymentType, $totals['total']);

            return response()->json([
                'order_id' => $order->id,
                'order_number' => "TRX-LW-{$order->id}",
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
            'order_number' => "TRX-LW-{$order->id}",
            'status' => 'pending',
            'total' => $totals['total'],
        ]);
    }

    public function paymentStatus(Order $order, MidtransService $midtrans): JsonResponse
    {
        if ($order->status === 'paid') {
            return response()->json(['status' => 'settlement']);
        }

        if ($order->status === 'cancelled') {
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

            match ($mapped) {
                'settlement' => tap($order)->update(['status' => 'paid']),
                'failed' => tap($order)->update(['status' => 'cancelled']),
                default => null,
            };

            if ($mapped === 'settlement') {
                broadcast(new OrderPaid($order))->toOthers();
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
}

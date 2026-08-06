<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\TableStatus;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Payment;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function __construct(
        private readonly MidtransService $midtrans,
    ) {}

    public function notification(Request $request): JsonResponse
    {
        $payload = $request->all();

        if ($invalid = $this->validatePayload($payload)) {
            return $invalid;
        }

        $order = Order::find($payload['order_id'] ?? null);
        if (! $order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($this->alreadyProcessed($payload)) {
            return response()->json(['message' => 'Already processed'], 200);
        }

        $transactionStatus = $this->resolveStatus($order, $payload);
        $this->recordPayment($order, $payload, $transactionStatus);
        $this->applyOrderStatus($order, $transactionStatus, $payload);

        return response()->json(['message' => 'OK']);
    }

    protected function validatePayload(array $payload): ?JsonResponse
    {
        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $signatureKey = $payload['signature_key'] ?? null;

        if (! $orderId || ! $statusCode || ! $grossAmount || ! $signatureKey) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        if (! $this->midtrans->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
            Log::warning('Midtrans webhook: invalid signature', ['order_id' => $orderId]);

            return response()->json(['error' => 'Invalid signature'], 403);
        }

        return null;
    }

    protected function alreadyProcessed(array $payload): bool
    {
        $existing = Payment::where('midtrans_transaction_id', $payload['transaction_id'] ?? null)->first();

        return $existing && $existing->status === 'success';
    }

    protected function resolveStatus(Order $order, array $payload): string
    {
        $statusFromApi = $this->midtrans->getTransactionStatus((string) $order->id);

        return $statusFromApi['transaction_status'] ?? $payload['transaction_status'] ?? '';
    }

    protected function recordPayment(Order $order, array $payload, string $transactionStatus): void
    {
        $paymentStatus = match (true) {
            in_array($transactionStatus, ['capture', 'settlement']) => 'success',
            in_array($transactionStatus, ['expire', 'cancel', 'deny']) => 'failed',
            default => 'pending',
        };

        Payment::updateOrCreate(
            ['midtrans_transaction_id' => $payload['transaction_id'] ?? $order->id],
            [
                'order_id' => $order->id,
                'method' => $payload['payment_type'] ?? ($order->payment?->method ?? 'qris'),
                'gross_amount' => $payload['gross_amount'],
                'status' => $paymentStatus,
                'signature_verified_at' => now(),
                'raw_payload' => json_encode($payload),
            ]
        );
    }

    protected function applyOrderStatus(Order $order, string $transactionStatus, array $payload): void
    {
        $paymentStatus = $this->paymentStatus($transactionStatus);

        if ($paymentStatus === 'success') {
            $this->markPaid($order);
        } elseif ($paymentStatus === 'failed') {
            $this->markFailed($order);
        }
    }

    protected function paymentStatus(string $transactionStatus): string
    {
        return match (true) {
            in_array($transactionStatus, ['capture', 'settlement']) => 'success',
            in_array($transactionStatus, ['expire', 'cancel', 'deny']) => 'failed',
            default => 'pending',
        };
    }

    protected function markPaid(Order $order): void
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

    protected function markFailed(Order $order): void
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
}

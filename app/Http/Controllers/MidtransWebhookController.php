<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Events\OrderPaid;
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

        $statusFromApi = $this->midtrans->getTransactionStatus($orderId);
        $transactionStatus = $statusFromApi['transaction_status'] ?? $payload['transaction_status'] ?? '';
        $fraudStatus = $statusFromApi['fraud_status'] ?? $payload['fraud_status'] ?? '';

        $order = Order::find($orderId);
        if (! $order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $existingPayment = Payment::where('midtrans_transaction_id', $payload['transaction_id'] ?? null)->first();
        if ($existingPayment && $existingPayment->status === 'success') {
            return response()->json(['message' => 'Already processed'], 200);
        }

        $paymentStatus = match (true) {
            in_array($transactionStatus, ['capture', 'settlement']) => 'success',
            in_array($transactionStatus, ['expire', 'cancel', 'deny']) => 'failed',
            default => 'pending',
        };

        $paymentMethod = $payload['payment_type'] ?? ($order->payment?->method ?? 'qris');

        Payment::updateOrCreate(
            ['midtrans_transaction_id' => $payload['transaction_id'] ?? $orderId],
            [
                'order_id' => $order->id,
                'method' => $paymentMethod,
                'gross_amount' => $grossAmount,
                'status' => $paymentStatus,
                'signature_verified_at' => now(),
                'raw_payload' => json_encode($payload),
            ]
        );

        if ($paymentStatus === 'success') {
            $updated = Order::where('id', $order->id)
                ->where('status', '!=', OrderStatus::Paid->value)
                ->update(['status' => OrderStatus::Paid->value]);

            if ($updated) {
                $order->refresh();
                broadcast(new OrderPaid($order))->toOthers();
            }
        } elseif ($paymentStatus === 'failed') {
            $order->update(['status' => OrderStatus::Cancelled]);
        }

        return response()->json(['message' => 'OK']);
    }
}

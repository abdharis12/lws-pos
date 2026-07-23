<?php

namespace App\Http\Controllers;

use App\Events\OrderPaid;
use App\Models\Order;
use App\Models\Payment;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    public function notification(Request $request, MidtransService $midtrans): JsonResponse
    {
        $payload = $request->all();

        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $signatureKey = $payload['signature_key'] ?? null;

        if (! $orderId || ! $statusCode || ! $grossAmount || ! $signatureKey) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        if (! $midtrans->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
            Log::warning('Midtrans webhook: invalid signature', ['order_id' => $orderId]);

            return response()->json(['error' => 'Invalid signature'], 403);
        }

        // Double-check with Midtrans API
        $statusFromApi = $midtrans->getTransactionStatus($orderId);
        $transactionStatus = $statusFromApi['transaction_status'] ?? $payload['transaction_status'] ?? '';
        $fraudStatus = $statusFromApi['fraud_status'] ?? $payload['fraud_status'] ?? '';

        $order = Order::find($orderId);
        if (! $order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        // Idempotency check
        $existingPayment = Payment::where('midtrans_transaction_id', $payload['transaction_id'] ?? null)->first();
        if ($existingPayment && $existingPayment->status === 'success') {
            return response()->json(['message' => 'Already processed'], 200);
        }

        $paymentStatus = match (true) {
            in_array($transactionStatus, ['capture', 'settlement']) => 'success',
            in_array($transactionStatus, ['expire', 'cancel', 'deny']) => 'failed',
            default => 'pending',
        };

        Payment::updateOrCreate(
            ['midtrans_transaction_id' => $payload['transaction_id'] ?? $orderId],
            [
                'order_id' => $order->id,
                'method' => 'qris',
                'gross_amount' => $grossAmount,
                'status' => $paymentStatus,
                'signature_verified_at' => now(),
                'raw_payload' => $payload,
            ]
        );

        if ($paymentStatus === 'success') {
            $order->update(['status' => 'paid']);
            broadcast(new OrderPaid($order))->toOthers();
        } elseif ($paymentStatus === 'failed') {
            $order->update(['status' => 'cancelled']);
        }

        return response()->json(['message' => 'OK']);
    }
}

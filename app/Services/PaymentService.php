<?php

namespace App\Services;

use App\Models\Order;

class PaymentService
{
    public function createPaymentRecord(Order $order, array $midtransResponse, string $paymentType, float $total): void
    {
        $order->payment()->create([
            'method' => $paymentType,
            'midtrans_transaction_id' => $midtransResponse['transaction_id'] ?? null,
            'gross_amount' => $total,
            'status' => 'pending',
            'raw_payload' => $midtransResponse ? json_encode($midtransResponse) : null,
        ]);
    }

    public function extractPaymentResponse(array $response): array
    {
        $data = [];

        if (! empty($response['actions'])) {
            foreach ($response['actions'] as $action) {
                if ($action['name'] === 'generate-qr-code') {
                    $data['qr_code'] = $action['url'];
                }
                if ($action['name'] === 'deeplink-redirect') {
                    $data['deeplink_url'] = $action['url'];
                }
            }
        }

        if (! empty($response['va_numbers'])) {
            $data['va_number'] = $response['va_numbers'][0]['va_number'];
            $data['bank'] = $response['va_numbers'][0]['bank'];
        }

        if (! empty($response['permata_va_number'])) {
            $data['va_number'] = $response['permata_va_number'];
            $data['bank'] = 'permata';
        }

        if (! empty($response['bill_key'])) {
            $data['bill_key'] = $response['bill_key'];
            $data['biller_code'] = $response['biller_code'] ?? null;
        }

        if (! empty($response['payment_code'])) {
            $data['payment_code'] = $response['payment_code'];
            $data['store'] = $response['store'] ?? null;
        }

        return $data;
    }
}

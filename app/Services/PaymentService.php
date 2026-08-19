<?php

namespace App\Services;

use App\Models\Order;

class PaymentService
{
    public function createPaymentRecord(Order $order, array $midtransResponse, string $paymentType, ?float $total = null, ?string $status = null): void
    {
        $order->payment()->create([
            'method' => $paymentType,
            'midtrans_transaction_id' => $midtransResponse['transaction_id'] ?? null,
            'gross_amount' => $total ?? (float) $order->total,
            'status' => $status ?? ($paymentType === 'cash' ? 'settlement' : 'pending'),
            'raw_payload' => $midtransResponse ? json_encode($midtransResponse) : null,
        ]);
    }

    public function extractPaymentResponse(array $response): array
    {
        $data = [];

        $this->extractActions($response, $data);
        $this->extractBankTransfer($response, $data);
        $this->extractPermata($response, $data);
        $this->extractBill($response, $data);
        $this->extractPaymentCode($response, $data);

        return $data;
    }

    protected function extractActions(array $response, array &$data): void
    {
        if (empty($response['actions'])) {
            return;
        }

        foreach ($response['actions'] as $action) {
            if ($action['name'] === 'generate-qr-code') {
                $data['qr_code'] = $action['url'];
            }
            if ($action['name'] === 'deeplink-redirect') {
                $data['deeplink_url'] = $action['url'];
            }
        }
    }

    protected function extractBankTransfer(array $response, array &$data): void
    {
        if (empty($response['va_numbers'])) {
            return;
        }

        $data['va_number'] = $response['va_numbers'][0]['va_number'];
        $data['bank'] = $response['va_numbers'][0]['bank'];
    }

    protected function extractPermata(array $response, array &$data): void
    {
        if (! empty($response['permata_va_number'])) {
            $data['va_number'] = $response['permata_va_number'];
            $data['bank'] = 'permata';
        }
    }

    protected function extractBill(array $response, array &$data): void
    {
        if (! empty($response['bill_key'])) {
            $data['bill_key'] = $response['bill_key'];
            $data['biller_code'] = $response['biller_code'] ?? null;
        }
    }

    protected function extractPaymentCode(array $response, array &$data): void
    {
        if (! empty($response['payment_code'])) {
            $data['payment_code'] = $response['payment_code'];
            $data['store'] = $response['store'] ?? null;
        }
    }
}

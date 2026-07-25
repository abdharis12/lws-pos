<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransService
{
    private string $serverKey;

    private string $baseUrl;

    public function __construct()
    {
        $this->serverKey = config('midtrans.server_key');
        $this->baseUrl = config('midtrans.is_production')
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    public function createCharge(string $orderId, int $grossAmount, string $paymentType): array
    {
        $payload = $this->buildPayload($orderId, $grossAmount, $paymentType);

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post("{$this->baseUrl}/charge", $payload);

        if (! $response->successful()) {
            Log::error('Midtrans charge failed', [
                'order_id' => $orderId,
                'payment_type' => $paymentType,
                'response' => $response->body(),
            ]);
        }

        return $response->json();
    }

    private function buildPayload(string $orderId, int $grossAmount, string $paymentType): array
    {
        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
            ],
        ];

        $bankMap = [
            'bca_va' => 'bca',
            'mandiri_va' => 'mandiri',
            'bni_va' => 'bni',
            'bri_va' => 'bri',
        ];

        return match ($paymentType) {
            'qris', 'gopay', 'shopeepay', 'akulaku' => array_merge($payload, [
                'payment_type' => $paymentType,
            ]),
            'bca_va', 'mandiri_va', 'bni_va', 'bri_va' => array_merge($payload, [
                'payment_type' => 'bank_transfer',
                'bank_transfer' => ['bank' => $bankMap[$paymentType]],
            ]),
            'permata_va' => array_merge($payload, [
                'payment_type' => 'permata',
            ]),
            'echannel' => array_merge($payload, [
                'payment_type' => 'echannel',
            ]),
            'indomaret', 'alfamart' => array_merge($payload, [
                'payment_type' => 'cstore',
                'cstore' => [
                    'store' => $paymentType === 'indomaret' ? 'Indomaret' : 'Alfamart',
                    'message' => "Pembayaran Pesanan {$orderId}",
                ],
            ]),
            default => array_merge($payload, [
                'payment_type' => 'qris',
            ]),
        };
    }

    public function getTransactionStatus(string $orderId): array
    {
        $response = Http::withBasicAuth($this->serverKey, '')
            ->get("{$this->baseUrl}/{$orderId}/status");

        return $response->json();
    }

    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signature): bool
    {
        $expected = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        return $signature === $expected;
    }
}

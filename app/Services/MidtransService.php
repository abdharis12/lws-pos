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
                'status' => $response->status(),
                'error_code' => $response->json('error_code') ?? 'unknown',
                'error_message' => $response->json('error_messages.0') ?? 'unknown',
            ]);
        }

        return $response->json();
    }

    private function buildPayload(string $orderId, int $grossAmount, string $paymentType): array
    {
        $base = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
            ],
        ];

        return match ($paymentType) {
            'bca_va', 'mandiri_va', 'bni_va', 'bri_va' => $this->withBankTransfer($base, $paymentType),
            'indomaret', 'alfamart' => $this->withCstore($base, $orderId, $paymentType),
            'permata_va' => $this->withPaymentType($base, 'permata'),
            'echannel' => $this->withPaymentType($base, 'echannel'),
            'qris', 'gopay', 'shopeepay', 'akulaku' => $this->withPaymentType($base, $paymentType),
            default => $this->withPaymentType($base, 'qris'),
        };
    }

    private function withPaymentType(array $payload, string $paymentType): array
    {
        return array_merge($payload, ['payment_type' => $paymentType]);
    }

    private function withBankTransfer(array $payload, string $paymentType): array
    {
        $bankMap = [
            'bca_va' => 'bca',
            'mandiri_va' => 'mandiri',
            'bni_va' => 'bni',
            'bri_va' => 'bri',
        ];

        return array_merge($payload, [
            'payment_type' => 'bank_transfer',
            'bank_transfer' => ['bank' => $bankMap[$paymentType]],
        ]);
    }

    private function withCstore(array $payload, string $orderId, string $paymentType): array
    {
        return array_merge($payload, [
            'payment_type' => 'cstore',
            'cstore' => [
                'store' => $paymentType === 'indomaret' ? 'Indomaret' : 'Alfamart',
                'message' => "Pembayaran Pesanan {$orderId}",
            ],
        ]);
    }

    public function getTransactionStatus(string $orderId): array
    {
        $response = Http::withBasicAuth($this->serverKey, '')
            ->get("{$this->baseUrl}/{$orderId}/status");

        return $response->json();
    }

    /**
     * Cancel/void an initiated but unsettled Midtrans transaction.
     * Best-effort: returns the raw response (registration/API may reject
     * already-final transactions, which is fine).
     */
    public function cancel(string $orderId): array
    {
        $response = Http::withBasicAuth($this->serverKey, '')
            ->post("{$this->baseUrl}/{$orderId}/cancel");

        if (! $response->successful()) {
            Log::warning('Midtrans cancel failed', [
                'order_id' => $orderId,
                'status' => $response->status(),
                'error_code' => $response->json('error_code') ?? 'unknown',
            ]);
        }

        return $response->json() ?? [];
    }

    public function verifySignature(string $orderId, string $statusCode, string $grossAmount, string $signature): bool
    {
        $expected = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        return hash_equals($expected, $signature);
    }
}

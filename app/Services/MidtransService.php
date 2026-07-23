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

    public function createQrisCharge(string $orderId, int $grossAmount): array
    {
        $payload = [
            'payment_type' => 'qris',
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $grossAmount,
            ],
        ];

        $response = Http::withBasicAuth($this->serverKey, '')
            ->withHeaders(['Content-Type' => 'application/json'])
            ->post("{$this->baseUrl}/charge", $payload);

        if (! $response->successful()) {
            Log::error('Midtrans charge failed', [
                'order_id' => $orderId,
                'response' => $response->body(),
            ]);
        }

        return $response->json();
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

<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Meja;
use App\Models\Order;
use App\Models\TableSession;
use App\Support\Money;

class SelfOrderService
{
    public function __construct(
        private readonly OrderItemBuilder $itemBuilder,
        private readonly PaymentService $paymentService,
    ) {}

    public function getOrCreateSession(Meja $table): TableSession
    {
        return $table->sessions()->where('status', 'active')->first()
            ?? $table->sessions()->create([
                'opened_at' => now(),
                'status' => 'active',
            ]);
    }

    public function buildOrderItems(array $items): array
    {
        return $this->itemBuilder->build($items);
    }

    public function attachOrderItems(Order $order, array $orderItems): void
    {
        $this->itemBuilder->attach($order, $orderItems);
    }

    public function calculateTotals(float $subtotal, string $paymentMethod): array
    {
        $taxRate = (float) config('pos.tax_rate', 0.10);
        $serviceChargeRate = (float) config('pos.service_charge_rate', 0.05);
        $chargePercent = (float) config('pos.midtrans.charge_percentage', 2.5);

        $tax = round($subtotal * $taxRate);

        if ($paymentMethod === 'online') {
            $serviceCharge = round($subtotal * $serviceChargeRate);
            $rawBeforeCharge = $subtotal + $tax + $serviceCharge;
            $midtransCharge = round($rawBeforeCharge * $chargePercent / 100 / 100) * 100;
            $total = $rawBeforeCharge + $midtransCharge;
            $roundingAmount = 0;
        } else {
            $serviceCharge = 0;
            $midtransCharge = 0;
            $rawTotal = $subtotal + $tax;
            $roundingAmount = Money::roundingAmount($rawTotal);
            $total = Money::ceilTo500($rawTotal);
        }

        return compact('tax', 'serviceCharge', 'midtransCharge', 'total', 'roundingAmount');
    }

    public function createOrder(
        TableSession $session,
        ?string $customerName,
        string $orderType,
        OrderStatus $status,
        float $subtotal,
        float $tax,
        float $serviceCharge,
        float $midtransCharge,
        float $total,
        float $roundingAmount = 0,
    ): Order {
        return $session->orders()->create([
            'order_type' => $orderType,
            'status' => $status,
            'customer_name' => $customerName,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'midtrans_charge' => $midtransCharge,
            'rounding_amount' => $roundingAmount,
            'discount' => 0,
            'total' => $total,
        ]);
    }

    public function createPayment(Order $order, array $midtransResponse, string $paymentType, float $total): void
    {
        $this->paymentService->createPaymentRecord($order, $midtransResponse, $paymentType, $total);
    }

    public function extractPaymentResponse(array $response): array
    {
        return $this->paymentService->extractPaymentResponse($response);
    }
}

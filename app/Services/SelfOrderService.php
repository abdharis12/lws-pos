<?php

namespace App\Services;

use App\Models\Meja;
use App\Models\Menu;
use App\Models\OptionItem;
use App\Models\Order;
use App\Models\TableSession;

class SelfOrderService
{
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
        $orderItems = [];

        foreach ($items as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $itemTotal = (int) round($menu->price * $item['qty']);
            $optionAdjustments = [];

            if (! empty($item['option_ids'])) {
                $counts = array_count_values($item['option_ids']);
                $optionItems = OptionItem::whereIn('id', array_keys($counts))->get()->keyBy('id');
                $adjustments = 0;

                foreach ($counts as $optionId => $count) {
                    if (isset($optionItems[$optionId])) {
                        $opt = $optionItems[$optionId];
                        $adjustments += $opt->price_adjustment * $count;
                        $optionAdjustments[] = [
                            'option_item_id' => $opt->id,
                            'price_adjustment' => $opt->price_adjustment,
                            'quantity' => $count,
                        ];
                    }
                }

                $itemTotal += (int) round($adjustments * $item['qty']);
            }

            $orderItems[] = [
                'menu_id' => $menu->id,
                'qty' => $item['qty'],
                'base_price' => $menu->price,
                'total_price' => $itemTotal,
                'notes' => $item['notes'] ?? null,
                'option_adjustments' => $optionAdjustments,
            ];
        }

        return $orderItems;
    }

    public function calculateTotals(int $subtotal, string $paymentMethod): array
    {
        $tax = (int) round($subtotal * 0.10);

        if ($paymentMethod === 'online') {
            $serviceCharge = (int) round($subtotal * 0.05);
            $totalBeforeCharge = $subtotal + $tax + $serviceCharge;
            $chargePercent = (float) config('midtrans.charge_percentage', 2.5);
            $midtransCharge = (int) (round($totalBeforeCharge * $chargePercent / 100 / 100) * 100);
            $total = $subtotal + $tax + $serviceCharge + $midtransCharge;

            return compact('tax', 'serviceCharge', 'midtransCharge', 'total');
        }

        $serviceCharge = 0;
        $midtransCharge = 0;
        $total = $subtotal + $tax;

        return compact('tax', 'serviceCharge', 'midtransCharge', 'total');
    }

    public function createOrder(TableSession $session, string $customerName, string $orderType, string $status, int $subtotal, int $tax, int $serviceCharge, int $midtransCharge, int $total): Order
    {
        return $session->orders()->create([
            'order_type' => $orderType,
            'status' => $status,
            'customer_name' => $customerName,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'midtrans_charge' => $midtransCharge,
            'discount' => 0,
            'total' => $total,
        ]);
    }

    public function attachOrderItems(Order $order, array $orderItems): void
    {
        foreach ($orderItems as $data) {
            $optionAdjustments = $data['option_adjustments'];
            unset($data['option_adjustments']);

            $orderItem = $order->items()->create($data);

            if (! empty($optionAdjustments)) {
                $orderItem->options()->createMany($optionAdjustments);
            }
        }
    }

    public function createPayment(Order $order, array $midtransResponse, string $paymentType, int $total): void
    {
        $transactionId = $midtransResponse['transaction_id'] ?? null;

        $order->payment()->create([
            'method' => $paymentType,
            'midtrans_transaction_id' => $transactionId,
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

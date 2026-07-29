<?php

namespace App\Services;

use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Models\ActivityLog;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\OptionItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class PosOrderService
{
    private const DISCOUNT_PERCENTAGE_THRESHOLD = 10;

    private const DISCOUNT_NOMINAL_THRESHOLD = 50000;

    public function buildOrderItems(array $items): array
    {
        $orderItems = [];

        foreach ($items as $item) {
            $menu = Menu::findOrFail($item['menu_id']);
            $itemTotal = $menu->price * $item['qty'];

            $selectedOptionIds = $item['option_ids'] ?? [];
            $optionAdjustments = [];

            if (! empty($selectedOptionIds)) {
                $counts = array_count_values($selectedOptionIds);
                $options = OptionItem::whereIn('id', array_keys($counts))->get()->keyBy('id');
                $adjustments = 0;

                foreach ($counts as $optionId => $count) {
                    if (isset($options[$optionId])) {
                        $opt = $options[$optionId];
                        $adjustments += $opt->price_adjustment * $count;
                        $optionAdjustments[] = [
                            'option_item_id' => $opt->id,
                            'price_adjustment' => $opt->price_adjustment,
                            'quantity' => $count,
                        ];
                    }
                }

                $itemTotal += $adjustments * $item['qty'];
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

    public function calculateDiscount(float $subtotal, array $validated): float
    {
        if (empty($validated['discount_type']) || empty($validated['discount_value'])) {
            return 0;
        }

        $value = (float) $validated['discount_value'];

        if ($validated['discount_type'] === 'percentage') {
            return min($subtotal * ($value / 100), $subtotal);
        }

        return min($value, $subtotal);
    }

    public function needsApproval(float $subtotal, array $validated): bool
    {
        $type = $validated['discount_type'] ?? null;
        $value = (float) ($validated['discount_value'] ?? 0);

        if ($type === 'percentage' && $value > self::DISCOUNT_PERCENTAGE_THRESHOLD) {
            return true;
        }

        if ($type === 'nominal' && $value > self::DISCOUNT_NOMINAL_THRESHOLD) {
            return true;
        }

        return false;
    }

    public function validateApproval(array $validated): void
    {
        if (empty($validated['discount_approved_by'])) {
            throw ValidationException::withMessages([
                'discount' => 'Diskon besar memerlukan persetujuan Admin/Owner.',
            ]);
        }

        $approver = User::find($validated['discount_approved_by']);
        if (! $approver || ! $approver->hasAnyRole(['Admin', 'Owner'])) {
            throw ValidationException::withMessages([
                'discount' => 'Hanya Admin atau Owner yang dapat menyetujui diskon besar.',
            ]);
        }
    }

    public function logDiscountActivity(int $userId, array $validated, string $context): void
    {
        ActivityLog::create([
            'user_id' => $userId,
            'action' => 'large_discount',
            'subject_type' => null,
            'subject_id' => null,
            'description' => 'Diskon besar diterapkan'.$context.': '.$validated['discount_type'].' '.$validated['discount_value'].' (disetujui: '.$validated['discount_approved_by'].')',
            'metadata' => $validated,
        ]);
    }

    public function getOrCreateSession(Meja $table): TableSession
    {
        return $table->sessions()->where('status', 'active')->first()
            ?? $table->sessions()->create([
                'opened_at' => now(),
                'status' => 'active',
            ]);
    }

    public function prepareGroupedTables(array $tableIds, int $mainTableId): array
    {
        return collect($tableIds)
            ->reject(fn ($id) => (int) $id === $mainTableId)
            ->unique()
            ->values()
            ->toArray();
    }

    public function getTaxRate(): float
    {
        return 0.10;
    }

    public function calculateTax(float $subtotal): float
    {
        return round($subtotal * $this->getTaxRate(), 2);
    }

    public function calculateServiceCharge(float $subtotal): float
    {
        return round($subtotal * 0.05, 2);
    }

    public function calculateMidtransCharge(float $amount): float
    {
        $chargePercent = (float) config('midtrans.charge_percentage', 2.5);

        return round($amount * $chargePercent / 100 / 100) * 100;
    }

    public function createSplitOrders(
        User $user,
        array $validated,
        array $orderItems,
        array $groupedTableIds,
        ?TableSession $session,
    ): array {
        $subtotal = array_sum(array_column($orderItems, 'total_price'));
        $discountAmount = $this->calculateDiscount($subtotal, $validated);
        $tax = $this->calculateTax($subtotal);
        $serviceCharge = 0;
        $total = max(0, $subtotal + $tax - $discountAmount);

        $splitCount = (int) ($validated['split_count'] ?? 1);
        $splitSubtotal = round($subtotal / $splitCount, 2);
        $splitTax = round($tax / $splitCount, 2);
        $splitTotal = round($total / $splitCount, 2);
        $splitDiscount = round($discountAmount / $splitCount, 2);

        $createdOrders = [];

        for ($i = 0; $i < $splitCount; $i++) {
            $isLast = $i === $splitCount - 1;

            $shared = [
                'created_by' => $user->id,
                'order_type' => $validated['order_type'] ?? 'dine_in',
                'customer_name' => $validated['customer_name'] ?? null,
                'status' => 'paid',
                'service_charge' => 0,
                'discount_type' => $validated['discount_type'] ?? null,
                'discount_value' => $validated['discount_value'] ?? null,
                'discount_approved_by' => $validated['discount_approved_by'] ?? null,
                'grouped_tables' => ! empty($groupedTableIds) ? $groupedTableIds : null,
            ];

            $order = $session?->orders()->create([
                ...$shared,
                'subtotal' => $isLast ? round($subtotal - $splitSubtotal * $i, 2) : $splitSubtotal,
                'tax' => $isLast ? round($tax - $splitTax * $i, 2) : $splitTax,
                'discount' => $isLast ? round($discountAmount - $splitDiscount * $i, 2) : $splitDiscount,
                'total' => $isLast ? round($total - $splitTotal * $i, 2) : $splitTotal,
                'notes' => $splitCount > 1 ? "Split {$i}/{$splitCount}" : null,
            ]) ?? Order::create([
                ...$shared,
                'subtotal' => $isLast ? round($subtotal - $splitSubtotal * $i, 2) : $splitSubtotal,
                'tax' => $isLast ? round($tax - $splitTax * $i, 2) : $splitTax,
                'discount' => $isLast ? round($discountAmount - $splitDiscount * $i, 2) : $splitDiscount,
                'total' => $isLast ? round($total - $splitTotal * $i, 2) : $splitTotal,
                'notes' => $splitCount > 1 ? "Split {$i}/{$splitCount}" : null,
            ]);

            foreach ($orderItems as $orderItemData) {
                $orderItem = $order->items()->create([
                    'menu_id' => $orderItemData['menu_id'],
                    'qty' => $orderItemData['qty'],
                    'base_price' => $orderItemData['base_price'],
                    'total_price' => $orderItemData['total_price'],
                    'notes' => $orderItemData['notes'],
                ]);

                if (! empty($orderItemData['option_adjustments'])) {
                    $orderItem->options()->createMany($orderItemData['option_adjustments']);
                }
            }

            if (! empty($validated['payment_method'])) {
                $order->payment()->create([
                    'method' => $validated['payment_method'],
                    'gross_amount' => $order->total,
                    'status' => 'settlement',
                ]);
            }

            $createdOrders[] = $order;
            broadcast(new OrderCreated($order))->toOthers();
            broadcast(new OrderPaid($order))->toOthers();
        }

        return $createdOrders;
    }

    public function processPendingOrderItems(Order $order, array $items): array
    {
        $existingItemIds = $order->items()->pluck('id')->toArray();
        $keptItemIds = [];
        $newSubtotal = 0;

        foreach ($items as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $itemTotal = $menu->price * $itemData['qty'];

            $selectedOptionIds = $itemData['option_ids'] ?? [];
            $optionAdjustments = [];

            if (! empty($selectedOptionIds)) {
                $counts = array_count_values($selectedOptionIds);
                $options = OptionItem::whereIn('id', array_keys($counts))->get()->keyBy('id');
                $adjustments = 0;

                foreach ($counts as $optionId => $count) {
                    if (isset($options[$optionId])) {
                        $opt = $options[$optionId];
                        $adjustments += $opt->price_adjustment * $count;
                        $optionAdjustments[] = [
                            'option_item_id' => $opt->id,
                            'price_adjustment' => $opt->price_adjustment,
                            'quantity' => $count,
                        ];
                    }
                }

                $itemTotal += $adjustments * $itemData['qty'];
            }

            $newSubtotal += $itemTotal;

            if (! empty($itemData['id']) && in_array($itemData['id'], $existingItemIds)) {
                $keptItemIds[] = $itemData['id'];
                $orderItem = OrderItem::find($itemData['id']);
                $orderItem->update([
                    'qty' => $itemData['qty'],
                    'total_price' => $itemTotal,
                    'notes' => $itemData['notes'] ?? null,
                ]);
                $orderItem->options()->delete();
                if (! empty($optionAdjustments)) {
                    $orderItem->options()->createMany($optionAdjustments);
                }
            } else {
                $orderItem = $order->items()->create([
                    'menu_id' => $menu->id,
                    'qty' => $itemData['qty'],
                    'base_price' => $menu->price,
                    'total_price' => $itemTotal,
                    'notes' => $itemData['notes'] ?? null,
                ]);
                if (! empty($optionAdjustments)) {
                    $orderItem->options()->createMany($optionAdjustments);
                }
            }
        }

        $itemsToDelete = array_diff($existingItemIds, $keptItemIds);
        if (! empty($itemsToDelete)) {
            OrderItem::whereIn('id', $itemsToDelete)->delete();
        }

        return ['new_subtotal' => $newSubtotal];
    }

    public function confirmAndFinalizeOrder(Order $order, array $validated, int $userId): void
    {
        $result = $this->processPendingOrderItems($order, $validated['items']);
        $newSubtotal = $result['new_subtotal'];

        $discountAmount = $this->calculateDiscount($newSubtotal, $validated);

        $tax = $this->calculateTax($newSubtotal);
        $serviceCharge = 0;
        $newTotal = max(0, $newSubtotal + $tax - $discountAmount);

        $order->update([
            'status' => 'paid',
            'subtotal' => $newSubtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $newTotal,
        ]);

        $order->payment()->create([
            'method' => $validated['payment_method'],
            'gross_amount' => $newTotal,
            'status' => 'settlement',
        ]);

        if ($order->tableSession?->table) {
            $order->tableSession->table->update(['status' => 'occupied']);
        }

        broadcast(new OrderPaid($order))->toOthers();
        broadcast(new OrderStatusUpdated($order))->toOthers();
    }

    public function updateOrderItems(Order $order, array $items): void
    {
        $result = $this->processPendingOrderItems($order, $items);
        $newSubtotal = $result['new_subtotal'];

        $tax = $this->calculateTax($newSubtotal);
        $discountAmount = $order->discount ?? 0;
        $serviceCharge = $order->service_charge ?? 0;
        $total = $newSubtotal + $tax + $serviceCharge - $discountAmount;

        $order->update([
            'subtotal' => $newSubtotal,
            'tax' => $tax,
            'total' => max(0, $total),
        ]);

        $order->refresh();

        OrderStatusUpdated::dispatch($order);
    }

    public function cancelPendingOrder(Order $order): void
    {
        $order->update(['status' => 'cancelled']);

        OrderStatusUpdated::dispatch($order);

        $session = $order->tableSession;
        if ($session) {
            $hasOtherPending = $session->orders()
                ->where('id', '!=', $order->id)
                ->where('status', 'pending')
                ->exists();

            if (! $hasOtherPending) {
                $session->update(['status' => 'closed', 'closed_at' => now()]);
            }
        }
    }

    public function getOrCreatePaymentOrder(
        User $user,
        array $validated,
        array $orderItems,
        ?TableSession $session,
    ): Order {
        $subtotal = array_sum(array_column($orderItems, 'total_price'));
        $discountAmount = $this->calculateDiscount($subtotal, $validated);
        $tax = $this->calculateTax($subtotal);
        $serviceCharge = $this->calculateServiceCharge($subtotal);

        $totalBeforeCharge = max(0, $subtotal + $tax + $serviceCharge - $discountAmount);
        $midtransCharge = $this->calculateMidtransCharge($totalBeforeCharge);
        $total = $totalBeforeCharge + $midtransCharge;

        $orderType = $validated['order_type'] ?? 'dine_in';

        $orderData = [
            'created_by' => $user->id,
            'order_type' => $orderType,
            'customer_name' => $validated['customer_name'] ?? null,
            'status' => 'pending_payment',
            'subtotal' => $subtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'midtrans_charge' => $midtransCharge,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $total,
        ];

        $order = $session?->orders()->create($orderData) ?? Order::create($orderData);

        $this->attachOrderItems($order, $orderItems);

        return $order;
    }

    public function createPaymentRecord(Order $order, array $midtransResponse, string $paymentType, float $total): void
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

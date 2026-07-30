<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\TableStatus;
use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Models\Meja;
use App\Models\Order;
use App\Models\TableSession;
use App\Models\User;

class PosOrderService
{
    public function __construct(
        private readonly OrderItemBuilder $itemBuilder,
        private readonly DiscountService $discountService,
        private readonly PaymentService $paymentService,
    ) {}

    public function buildOrderItems(array $items): array
    {
        return $this->itemBuilder->build($items);
    }

    public function attachOrderItems(Order $order, array $orderItems): void
    {
        $this->itemBuilder->attach($order, $orderItems);
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

    public function calculateDiscount(float $subtotal, array $validated): float
    {
        return $this->discountService->calculate(
            $subtotal,
            $validated['discount_type'] ?? null,
            $validated['discount_value'] ?? null,
        );
    }

    public function needsApproval(float $subtotal, array $validated): bool
    {
        return $this->discountService->needsApproval(
            $subtotal,
            $validated['discount_type'] ?? null,
            $validated['discount_value'] ?? null,
        );
    }

    public function validateApproval(array $validated): void
    {
        $this->discountService->validateApproval($validated);
    }

    public function getTaxRate(): float
    {
        return (float) config('pos.tax_rate', 0.10);
    }

    public function calculateTax(float $subtotal): float
    {
        return round($subtotal * $this->getTaxRate(), 2);
    }

    public function calculateServiceCharge(float $subtotal): float
    {
        return round($subtotal * (float) config('pos.service_charge_rate', 0.05), 2);
    }

    public function calculateMidtransCharge(float $amount): float
    {
        $chargePercent = (float) config('pos.midtrans.charge_percentage', 2.5);

        return round($amount * $chargePercent / 100 / 100) * 100;
    }

    public function createSplitOrders(
        User $user,
        array $validated,
        array $orderItems,
        array $groupedTableIds,
        ?TableSession $session,
        ?int $posSessionId = null,
    ): array {
        $subtotal = array_sum(array_column($orderItems, 'total_price'));
        $discountAmount = $this->calculateDiscount($subtotal, $validated);
        $tax = $this->calculateTax($subtotal);
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
                'pos_session_id' => $posSessionId,
                'order_type' => $validated['order_type'] ?? 'dine_in',
                'customer_name' => $validated['customer_name'] ?? null,
                'status' => OrderStatus::Paid,
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

            $this->itemBuilder->attach($order, $orderItems);

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
            $built = $this->itemBuilder->buildSingle($itemData);
            $newSubtotal += $built['total_price'];

            if (! empty($itemData['id']) && in_array($itemData['id'], $existingItemIds)) {
                $keptItemIds[] = $itemData['id'];
                $orderItem = $order->items()->find($itemData['id']);
                $orderItem->update([
                    'qty' => $built['qty'],
                    'total_price' => $built['total_price'],
                    'notes' => $built['notes'],
                ]);
                $orderItem->options()->delete();
                if (! empty($built['option_adjustments'])) {
                    $orderItem->options()->createMany($built['option_adjustments']);
                }
            } else {
                $this->itemBuilder->attach($order, [$built]);
            }
        }

        $itemsToDelete = array_diff($existingItemIds, $keptItemIds);
        if (! empty($itemsToDelete)) {
            $order->items()->whereIn('id', $itemsToDelete)->delete();
        }

        return ['new_subtotal' => $newSubtotal];
    }

    public function confirmAndFinalizeOrder(Order $order, array $validated, int $userId): void
    {
        $result = $this->processPendingOrderItems($order, $validated['items']);
        $newSubtotal = $result['new_subtotal'];

        $discountAmount = $this->calculateDiscount($newSubtotal, $validated);
        $tax = $this->calculateTax($newSubtotal);

        $order->update([
            'status' => OrderStatus::Paid,
            'subtotal' => $newSubtotal,
            'tax' => $tax,
            'service_charge' => 0,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => max(0, $newSubtotal + $tax - $discountAmount),
        ]);

        $order->payment()->create([
            'method' => $validated['payment_method'],
            'gross_amount' => $order->total,
            'status' => 'settlement',
        ]);

        if ($order->tableSession?->table) {
            $order->tableSession->table->update(['status' => TableStatus::Occupied]);
        }

        broadcast(new OrderPaid($order))->toOthers();
        broadcast(new OrderStatusUpdated($order))->toOthers();
    }

    public function updateOrderItems(Order $order, array $items): void
    {
        $result = $this->processPendingOrderItems($order, $items);
        $newSubtotal = $result['new_subtotal'];

        $order->update([
            'subtotal' => $newSubtotal,
            'tax' => $this->calculateTax($newSubtotal),
            'total' => max(0, $newSubtotal + $this->calculateTax($newSubtotal) + ($order->service_charge ?? 0) - ($order->discount ?? 0)),
        ]);

        OrderStatusUpdated::dispatch($order);
    }

    public function cancelPendingOrder(Order $order): void
    {
        $order->update(['status' => OrderStatus::Cancelled]);

        OrderStatusUpdated::dispatch($order);

        $session = $order->tableSession;
        if ($session) {
            $hasOtherPending = $session->orders()
                ->where('id', '!=', $order->id)
                ->whereIn('status', [OrderStatus::Pending, OrderStatus::PendingPayment])
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
        ?int $posSessionId = null,
    ): Order {
        $subtotal = array_sum(array_column($orderItems, 'total_price'));
        $discountAmount = $this->calculateDiscount($subtotal, $validated);
        $tax = $this->calculateTax($subtotal);
        $serviceCharge = $this->calculateServiceCharge($subtotal);

        $totalBeforeCharge = max(0, $subtotal + $tax + $serviceCharge - $discountAmount);
        $midtransCharge = $this->calculateMidtransCharge($totalBeforeCharge);

        $orderData = [
            'created_by' => $user->id,
            'pos_session_id' => $posSessionId,
            'order_type' => $validated['order_type'] ?? 'dine_in',
            'customer_name' => $validated['customer_name'] ?? null,
            'status' => OrderStatus::PendingPayment,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'midtrans_charge' => $midtransCharge,
            'discount' => $discountAmount,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $totalBeforeCharge + $midtransCharge,
        ];

        $order = $session?->orders()->create($orderData) ?? Order::create($orderData);
        $this->itemBuilder->attach($order, $orderItems);

        return $order;
    }
}

<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\TableStatus;
use App\Events\OrderCreated;
use App\Events\OrderPaid;
use App\Events\OrderStatusUpdated;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\OptionItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TableSession;
use App\Models\User;
use App\Support\Money;

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

    /**
     * Calculate discount and enforce approval if needed.
     * This method cannot be bypassed by controllers forgetting to call validateApproval.
     */
    public function calculateDiscountWithApproval(float $subtotal, array $validated): float
    {
        $discount = $this->calculateDiscount($subtotal, $validated);

        if ($this->needsApproval($subtotal, $validated)) {
            $this->validateApproval($validated);
        }

        return $discount;
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
        return round($subtotal * $this->getTaxRate());
    }

    public function calculateServiceCharge(float $subtotal): float
    {
        return round($subtotal * (float) config('pos.service_charge_rate', 0.05));
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
        $plan = $this->splitPlan($orderItems, $validated);
        $createdOrders = [];

        for ($i = 0; $i < $plan['count']; $i++) {
            $amounts = $this->splitAmountsFor($i, $plan['count'], $plan['totals'], $plan['split']);
            $order = $this->createSplitOrderRecord(
                $user, $validated, $orderItems, $groupedTableIds, $session, $posSessionId, $i, $plan['count'], $amounts,
            );

            $createdOrders[] = $order;
            $this->announceSplitOrder($order);
        }

        return $createdOrders;
    }

    protected function splitPlan(array $orderItems, array $validated): array
    {
        $subtotal = array_sum(array_column($orderItems, 'total_price'));
        $discountAmount = $this->calculateDiscount($subtotal, $validated);
        $tax = $this->calculateTax($subtotal);
        $rawTotal = max(0, $subtotal + $tax - $discountAmount);
        $roundingAmount = Money::roundingAmount($rawTotal);
        $total = Money::ceilTo500($rawTotal);
        $splitCount = (int) ($validated['split_count'] ?? 1);

        return [
            'count' => $splitCount,
            'totals' => compact('subtotal', 'tax', 'discountAmount', 'roundingAmount', 'total'),
            'split' => [
                'subtotal' => round($subtotal / $splitCount),
                'tax' => round($tax / $splitCount),
                'total' => (float) ceil($total / $splitCount / 500) * 500,
                'discount' => round($discountAmount / $splitCount),
                'rounding' => $roundingAmount,
            ],
        ];
    }

    protected function announceSplitOrder(Order $order): void
    {
        broadcast(new OrderCreated($order))->toOthers();
        broadcast(new OrderPaid($order))->toOthers();
    }

    protected function splitAmountsFor(int $i, int $splitCount, array $totals, array $split): array
    {
        $isLast = $i === $splitCount - 1;

        return [
            'subtotal' => $isLast ? $totals['subtotal'] - $split['subtotal'] * ($splitCount - 1) : $split['subtotal'],
            'tax' => $isLast ? $totals['tax'] - $split['tax'] * ($splitCount - 1) : $split['tax'],
            'discount' => $isLast ? $totals['discountAmount'] - $split['discount'] * ($splitCount - 1) : $split['discount'],
            'rounding' => $isLast ? $totals['roundingAmount'] - $split['rounding'] * ($splitCount - 1) : $split['rounding'],
            'total' => $isLast ? $totals['total'] - $split['total'] * ($splitCount - 1) : $split['total'],
        ];
    }

    protected function createSplitOrderRecord(
        User $user,
        array $validated,
        array $orderItems,
        array $groupedTableIds,
        ?TableSession $session,
        ?int $posSessionId,
        int $i,
        int $splitCount,
        array $amounts,
    ): Order {
        $data = $this->splitOrderData($this->splitShared($user, $validated, $groupedTableIds, $posSessionId), $amounts, $i, $splitCount);

        $order = $session?->orders()->create($data) ?? Order::create($data);
        $this->itemBuilder->attach($order, $orderItems);
        $this->attachIfAsked($order, $validated);

        return $order;
    }

    protected function splitShared(User $user, array $validated, array $groupedTableIds, ?int $posSessionId): array
    {
        return [
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
    }

    protected function splitOrderData(array $shared, array $amounts, int $i, int $splitCount): array
    {
        return [
            ...$shared,
            'subtotal' => $amounts['subtotal'],
            'tax' => $amounts['tax'],
            'discount' => $amounts['discount'],
            'rounding_amount' => $amounts['rounding'],
            'total' => $amounts['total'],
            'notes' => $splitCount > 1 ? "Split {$i}/{$splitCount}" : null,
        ];
    }

    protected function attachIfAsked(Order $order, array $validated): void
    {
        if (! empty($validated['payment_method'])) {
            $order->payment()->create([
                'method' => $validated['payment_method'],
                'gross_amount' => $order->total,
                'status' => 'settlement',
            ]);
        }
    }

    public function processPendingOrderItems(Order $order, array $items): array
    {
        $existingItems = $order->items()->get()->keyBy('id');
        $keptItemIds = [];
        $newSubtotal = 0;
        [$menus, $optionsByItem] = $this->itemLookup($items);
        $itemBuilder = $this->itemBuilder;

        foreach ($items as $itemData) {
            $built = $itemBuilder->buildSingle($itemData, $menus, $optionsByItem);
            $newSubtotal += $built['total_price'];

            if (! empty($itemData['id']) && $existingItems->has($itemData['id'])) {
                $keptItemIds[] = $itemData['id'];
                $this->updateOrderItem($existingItems[$itemData['id']], $built);
            } else {
                $this->addNewOrderItem($order, $built);
            }
        }

        $itemsToDelete = array_diff($existingItems->keys()->all(), $keptItemIds);
        if (! empty($itemsToDelete)) {
            $order->items()->whereIn('id', $itemsToDelete)->delete();
        }

        return ['new_subtotal' => $newSubtotal];
    }

    protected function itemLookup(array $items): array
    {
        $menuIds = array_unique(array_column($items, 'menu_id'));
        $menus = Menu::whereIn('id', $menuIds)->get()->keyBy('id');
        $optionIds = array_unique(array_merge(...array_map(
            fn (array $item) => $item['option_ids'] ?? [],
            $items,
        )));

        $optionsByItem = $optionIds
            ? OptionItem::whereIn('id', $optionIds)->get()->keyBy('id')
            : collect();

        return [$menus, $optionsByItem];
    }

    protected function updateOrderItem(OrderItem $orderItem, array $built): void
    {
        $orderItem->update([
            'qty' => $built['qty'],
            'total_price' => $built['total_price'],
            'notes' => $built['notes'],
        ]);

        $orderItem->options()->delete();

        if (! empty($built['option_adjustments'])) {
            $orderItem->options()->createMany($built['option_adjustments']);
        }
    }

    protected function addNewOrderItem(Order $order, array $built): void
    {
        $this->itemBuilder->attach($order, [$built]);
    }

    public function confirmAndFinalizeOrder(Order $order, array $validated, int $userId): void
    {
        $result = $this->processPendingOrderItems($order, $validated['items']);
        $newSubtotal = $result['new_subtotal'];
        $totals = $this->orderTotals($newSubtotal, $validated);

        $order->update([
            'status' => OrderStatus::Paid,
            'subtotal' => $newSubtotal,
            ...$totals,
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
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

    protected function orderTotals(float $subtotal, array $validated): array
    {
        $discountAmount = $this->calculateDiscount($subtotal, $validated);
        $tax = $this->calculateTax($subtotal);
        $rawTotal = max(0, $subtotal + $tax - $discountAmount);

        return [
            'tax' => $tax,
            'service_charge' => 0,
            'rounding_amount' => Money::roundingAmount($rawTotal),
            'discount' => $discountAmount,
            'total' => Money::ceilTo500($rawTotal),
        ];
    }

    public function updateOrderItems(Order $order, array $items): void
    {
        $result = $this->processPendingOrderItems($order, $items);
        $newSubtotal = $result['new_subtotal'];
        $tax = $this->calculateTax($newSubtotal);
        $rawTotal = max(0, $newSubtotal + $tax + ($order->service_charge ?? 0) - ($order->discount ?? 0));

        $order->update([
            'subtotal' => $newSubtotal,
            'tax' => $tax,
            'rounding_amount' => Money::roundingAmount($rawTotal),
            'total' => Money::ceilTo500($rawTotal),
        ]);

        OrderStatusUpdated::dispatch($order);
    }

    public function cancelPendingOrder(Order $order): void
    {
        $order->update(['status' => OrderStatus::Cancelled]);
        OrderStatusUpdated::dispatch($order);

        $session = $order->tableSession;
        if ($session && $this->hasNoOtherPending($session, $order->id)) {
            $this->closeIdleSession($session);
        }
    }

    /**
     * Void an initiated-but-unpaid Midtrans charge and mark its payment record
     * as failed. Best-effort: if Midtrans already finalised the transaction
     * the cancel call is a no-op (the webhook/poll will settle it instead).
     */
    public function voidMidtransPayment(Order $order, MidtransService $midtrans): void
    {
        if (! $order->payment) {
            return;
        }

        $midtrans->cancel((string) $order->id);

        $order->payment->update(['status' => 'failed']);
    }

    protected function hasNoOtherPending(TableSession $session, int $orderId): bool
    {
        return ! $session->orders()
            ->where('id', '!=', $orderId)
            ->whereIn('status', [OrderStatus::Pending, OrderStatus::PendingPayment])
            ->exists();
    }

    protected function closeIdleSession(TableSession $session): void
    {
        $session->update(['status' => 'closed', 'closed_at' => now()]);

        $hasActiveOrder = $session->orders()->whereIn('status', [
            OrderStatus::Paid->value,
            OrderStatus::Processing->value,
            OrderStatus::Ready->value,
        ])->exists();

        if ($session->table && ! $hasActiveOrder) {
            $session->table->update(['status' => TableStatus::Available, 'locked_by' => null]);
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
        $totals = $this->paymentTotals($subtotal, $validated);
        $orderData = $this->paymentOrderData($user, $validated, $subtotal, $totals, $posSessionId);

        $order = $session?->orders()->create($orderData) ?? Order::create($orderData);
        $this->itemBuilder->attach($order, $orderItems);

        return $order;
    }

    protected function paymentTotals(float $subtotal, array $validated): array
    {
        $discountAmount = $this->calculateDiscount($subtotal, $validated);
        $tax = $this->calculateTax($subtotal);
        $serviceCharge = $this->calculateServiceCharge($subtotal);
        $rawTotalBeforeCharge = max(0, $subtotal + $tax + $serviceCharge - $discountAmount);
        $midtransCharge = $this->calculateMidtransCharge($rawTotalBeforeCharge);

        return [
            'tax' => $tax,
            'service_charge' => $serviceCharge,
            'midtrans_charge' => $midtransCharge,
            'discount' => $discountAmount,
            'total' => $rawTotalBeforeCharge + $midtransCharge,
        ];
    }

    protected function paymentOrderData(User $user, array $validated, float $subtotal, array $totals, ?int $posSessionId): array
    {
        return [
            'created_by' => $user->id,
            'pos_session_id' => $posSessionId,
            'order_type' => $validated['order_type'] ?? 'dine_in',
            'customer_name' => $validated['customer_name'] ?? null,
            'status' => OrderStatus::PendingPayment,
            'subtotal' => $subtotal,
            'tax' => $totals['tax'],
            'service_charge' => $totals['service_charge'],
            'midtrans_charge' => $totals['midtrans_charge'],
            'rounding_amount' => 0,
            'discount' => $totals['discount'],
            'discount_type' => $validated['discount_type'] ?? null,
            'discount_value' => $validated['discount_value'] ?? null,
            'discount_approved_by' => $validated['discount_approved_by'] ?? null,
            'total' => $totals['total'],
        ];
    }
}

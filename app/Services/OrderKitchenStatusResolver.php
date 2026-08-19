<?php

namespace App\Services;

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\OrderItem;

/**
 * Derives an order's overall kitchen status from its line items.
 *
 * The KDS shows one order split across stations (Main, Drink). Each station
 * can be cooked and finished independently, so the order's status is only
 * promoted once the whole order is complete:
 *   - all items ready        -> ready
 *   - any item in progress   -> processing
 *   - nothing started yet    -> paid
 */
class OrderKitchenStatusResolver
{
    public static function resolve(Order $order): OrderStatus
    {
        $items = $order->items->filter(fn ($item) => $item instanceof OrderItem);

        if ($items->isEmpty()) {
            return OrderStatus::Paid;
        }

        // Debug logging
        \Log::info('OrderKitchenStatusResolver::resolve', [
            'order_id' => $order->id,
            'items_count' => $items->count(),
            'items' => $items->map(fn ($item) => [
                'id' => $item->id,
                'status' => $item->status?->value ?? 'null',
            ])->toArray(),
        ]);

        if ($items->isEmpty()) {
            return OrderStatus::Paid;
        }

        if ($items->every(fn ($item) => $item->status === OrderItemStatus::Ready)) {
            return OrderStatus::Ready;
        }

        if ($items->contains(fn ($item) => in_array($item->status, [
            OrderItemStatus::Processing,
            OrderItemStatus::Ready,
        ], true))) {
            return OrderStatus::Processing;
        }

        return OrderStatus::Paid;
    }

    /**
     * Persist the resolved order status and notify watchers when it changes.
     */
    public static function apply(Order $order): OrderStatus
    {
        $status = self::resolve($order);

        if ($order->status !== $status) {
            $order->update(['status' => $status]);
            $order->refresh();
            broadcast(new OrderStatusUpdated($order))->toOthers();
        }

        return $status;
    }
}

<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\TableStatus;
use App\Events\OrderStatusUpdated;
use App\Models\Meja;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class SelfOrderPaymentExpiryService
{
    public function expire(Order $order): bool
    {
        $expiredOrder = DB::transaction(function () use ($order): ?Order {
            $lockedOrder = Order::query()
                ->with(['payment', 'tableSession'])
                ->lockForUpdate()
                ->find($order->id);

            if (
                ! $lockedOrder
                || $lockedOrder->status !== OrderStatus::PendingPayment
                || ! $lockedOrder->payment_expires_at
                || $lockedOrder->payment_expires_at->isFuture()
            ) {
                return null;
            }

            $tableSession = $lockedOrder->tableSession;
            $table = $tableSession?->table_id
                ? Meja::query()->lockForUpdate()->find($tableSession->table_id)
                : null;

            if ($lockedOrder->payment) {
                $lockedOrder->payment->update(['status' => 'failed']);
            }

            $lockedOrder->update(['status' => OrderStatus::Cancelled]);

            if ($tableSession && $table) {
                $hasActiveOrders = $tableSession->orders()
                    ->whereIn('status', [
                        OrderStatus::Pending->value,
                        OrderStatus::PendingPayment->value,
                        OrderStatus::Paid->value,
                        OrderStatus::Processing->value,
                        OrderStatus::Processed->value,
                        OrderStatus::Ready->value,
                    ])
                    ->exists();

                if (! $hasActiveOrders) {
                    $tableSession->update(['status' => 'closed', 'closed_at' => now()]);
                    $table->update(['status' => TableStatus::Available, 'locked_by' => null]);
                }
            }

            return $lockedOrder->refresh();
        });

        if (! $expiredOrder) {
            return false;
        }

        broadcast(new OrderStatusUpdated($expiredOrder))->toOthers();

        return true;
    }
}

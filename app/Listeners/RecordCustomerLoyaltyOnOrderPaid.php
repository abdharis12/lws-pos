<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Services\CustomerService;
use App\Services\LoyaltyService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class RecordCustomerLoyaltyOnOrderPaid implements ShouldQueue
{
    public function __construct(
        private readonly CustomerService $customerService,
        private readonly LoyaltyService $loyaltyService,
    ) {}

    public function handle(OrderPaid $event): void
    {
        $order = $event->order;

        if (! $order->customer_id) {
            return;
        }

        try {
            $this->customerService->recordVisit($order);
            $pointsEarned = $this->loyaltyService->awardPointsForOrder($order);

            Log::info('Loyalty recorded for order', [
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'points_earned' => $pointsEarned,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to record loyalty', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

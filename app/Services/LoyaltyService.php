<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class LoyaltyService
{
    /**
     * Award points for a paid order: 1 point per Rp1.000 spent.
     */
    public function awardPointsForOrder(Order $order): int
    {
        if (! $order->customer_id) {
            return 0;
        }

        $points = (int) floor(((float) $order->total) / 1000 * Customer::POINTS_PER_1000_SPEND);

        if ($points <= 0) {
            return 0;
        }

        DB::transaction(function () use ($order, $points) {
            /** @var Customer|null $customer */
            $customer = Customer::lockForUpdate()->find($order->customer_id);
            if (! $customer) {
                return;
            }

            $customer->increment('points', $points);
        });

        return $points;
    }

    public function redeemPoints(Customer $customer, int $points): Customer
    {
        return DB::transaction(function () use ($customer, $points) {
            /** @var Customer $locked */
            $locked = Customer::lockForUpdate()->findOrFail($customer->id);

            if ($locked->points < $points) {
                throw new \InvalidArgumentException("Poin tidak cukup. Tersedia: {$locked->points}, dibutuhkan: {$points}");
            }

            $locked->decrement('points', $points);

            return $locked->fresh();
        });
    }

    public function getTierProgress(Customer $customer): array
    {
        $spend = (float) $customer->total_spend;
        $thresholds = Customer::TIER_THRESHOLDS;

        $nextTier = null;
        $nextThreshold = null;

        foreach ($thresholds as $tier => $threshold) {
            if ($spend < $threshold) {
                $nextTier = $tier;
                $nextThreshold = (float) $threshold;

                break;
            }
        }

        return [
            'current_tier' => $customer->tier,
            'total_spend' => $spend,
            'next_tier' => $nextTier,
            'next_tier_threshold' => $nextThreshold,
            'progress_percent' => $nextThreshold !== null && $nextThreshold > 0
                ? round(min(100, ($spend / $nextThreshold) * 100), 1)
                : 100.0,
            'remaining_to_next' => $nextThreshold !== null ? max(0, $nextThreshold - $spend) : 0,
        ];
    }
}

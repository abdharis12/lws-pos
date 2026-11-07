<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\SelfOrderPaymentExpiryService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:expire-self-order-payments')]
#[Description('Cancel expired manual QRIS self-order payments')]
class ExpireSelfOrderPayments extends Command
{
    public function handle(SelfOrderPaymentExpiryService $expiryService): int
    {
        $expiredCount = 0;

        Order::query()
            ->where('status', 'pending_payment')
            ->whereNotNull('payment_expires_at')
            ->where('payment_expires_at', '<=', now())
            ->select('id')
            ->chunkById(100, function ($orders) use ($expiryService, &$expiredCount): void {
                foreach ($orders as $order) {
                    if ($expiryService->expire($order)) {
                        $expiredCount++;
                    }
                }
            });

        $this->info("Expired {$expiredCount} self-order QRIS payment(s).");

        return self::SUCCESS;
    }
}

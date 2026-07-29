<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\MidtransService;
use Illuminate\Console\Command;

class CheckPendingPayments extends Command
{
    protected $signature = 'payments:check-pending';

    protected $description = 'Check pending payments status from Midtrans';

    public function handle(MidtransService $midtrans): int
    {
        $pendingOrders = Order::where('status', OrderStatus::PendingPayment)
            ->where('created_at', '<', now()->subMinutes(2))
            ->get();

        foreach ($pendingOrders as $order) {
            $status = $midtrans->getTransactionStatus("{$order->id}");

            $transactionStatus = $status['transaction_status'] ?? '';

            if (in_array($transactionStatus, ['capture', 'settlement'])) {
                $order->update(['status' => OrderStatus::Paid]);
                $this->info("Order {$order->id} updated to paid");
            } elseif (in_array($transactionStatus, ['expire', 'cancel', 'deny'])) {
                $order->update(['status' => OrderStatus::Cancelled]);
                $this->info("Order {$order->id} updated to cancelled");
            }
        }

        return Command::SUCCESS;
    }
}

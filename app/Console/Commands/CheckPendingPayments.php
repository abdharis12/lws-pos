<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\MidtransService;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

class CheckPendingPayments extends Command
{
    protected $signature = 'payments:check-pending';

    protected $description = 'Check pending payments status from Midtrans';

    public function handle(MidtransService $midtrans): int
    {
        [$paidIds, $cancelledIds] = $this->collectStatuses($midtrans);
        $this->applyUpdates($paidIds, $cancelledIds);

        return Command::SUCCESS;
    }

    protected function collectStatuses(MidtransService $midtrans): array
    {
        $paidIds = [];
        $cancelledIds = [];

        Order::where('status', OrderStatus::PendingPayment)
            ->where('created_at', '<', now()->subMinutes(2))
            ->chunkById(100, function (Collection $orders) use ($midtrans, &$paidIds, &$cancelledIds) {
                foreach ($orders as $order) {
                    [$paid, $cancelled] = $this->classifyOrder($order, $midtrans);

                    if ($paid) {
                        $paidIds[] = $order->id;
                    }

                    if ($cancelled) {
                        $cancelledIds[] = $order->id;
                    }
                }
            });

        return [$paidIds, $cancelledIds];
    }

    protected function classifyOrder(Order $order, MidtransService $midtrans): array
    {
        $transactionStatus = $midtrans->getTransactionStatus((string) $order->id)['transaction_status'] ?? '';

        return [
            in_array($transactionStatus, ['capture', 'settlement']),
            in_array($transactionStatus, ['expire', 'cancel', 'deny']),
        ];
    }

    protected function applyUpdates(array $paidIds, array $cancelledIds): void
    {
        if ($paidIds) {
            Order::whereIn('id', $paidIds)->update(['status' => OrderStatus::Paid]);
            $this->info('Orders updated to paid: '.implode(', ', $paidIds));
        }

        if ($cancelledIds) {
            Order::whereIn('id', $cancelledIds)->update(['status' => OrderStatus::Cancelled]);
            $this->info('Orders updated to cancelled: '.implode(', ', $cancelledIds));
        }
    }
}

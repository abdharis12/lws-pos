<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class OrderPaid implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load([
            'items.menu',
            'items.options.optionItem',
            'tableSession.table',
            'posSession',
            'createdBy.employee',
        ]);
    }

    public function broadcastOn(): array
    {
        $outletId = $this->order->outletId();

        return $outletId
            ? [new PrivateChannel("outlet.{$outletId}.kitchen")]
            : [];
    }
}

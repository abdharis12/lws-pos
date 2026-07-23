<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class OrderPaid implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load(['items.menu', 'tableSession.table']);
    }

    public function broadcastOn(): array
    {
        $outletId = $this->order->tableSession?->table?->outlet_id;

        return $outletId
            ? [new PrivateChannel("outlet.{$outletId}.kitchen")]
            : [];
    }
}

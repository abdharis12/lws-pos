<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function broadcastOn(): array
    {
        $channels = [];

        $outletId = $this->order->tableSession?->table?->outlet_id;
        $tableToken = $this->order->tableSession?->table?->table_token;

        if ($outletId) {
            $channels[] = new PrivateChannel("outlet.{$outletId}.pos");
        }

        if ($tableToken) {
            $channels[] = new Channel("table.{$tableToken}");
        }

        return $channels;
    }

    public function broadcastWith(): array
    {
        return [
            'order' => [
                'id' => $this->order->id,
                'status' => $this->order->status,
            ],
        ];
    }
}

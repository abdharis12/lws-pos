<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class OrderStatusUpdated implements ShouldBroadcastNow
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
        $this->order->refresh();
        $order = $this->order->loadMissing([
            'tableSession.table',
            'items.menu',
            'items.options.optionItem',
            'items.options',
        ]);

        $items = $order->items->map(fn ($item) => [
            'id' => $item->id,
            'menu' => ['name' => $item->menu->name],
            'qty' => $item->qty,
            'notes' => $item->notes,
            'status' => $item->status?->value ?? 'pending',
            'options' => $item->options->map(fn ($opt) => [
                'quantity' => $opt->quantity,
                'option_item' => ['name' => $opt->optionItem?->name ?? ''],
            ]),
        ]);

        return [
            'order' => [
                'id' => $order->id,
                'status' => $order->status->value,
                'table_code' => $order->tableSession?->table?->code,
                'customer_name' => $order->customer_name,
                'item_count' => $order->items->sum('qty'),
                'items' => $items,
                'subtotal' => (float) $order->subtotal,
                'tax' => (float) $order->tax,
                'total' => (float) $order->total,
            ],
        ];
    }
}

<?php

namespace App\Events;

use App\Models\Meja;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class TableStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public Meja $table;

    public function __construct(Meja $table)
    {
        $this->table = $table;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel("outlet.{$this->table->outlet_id}.pos")];
    }
}

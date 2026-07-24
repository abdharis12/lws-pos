<?php

namespace App\Events;

use App\Models\Menu;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class MenuAvailabilityChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public Menu $menu;

    public bool $isAvailable;

    public function __construct(Menu $menu, bool $isAvailable)
    {
        $this->menu = $menu;
        $this->isAvailable = $isAvailable;
    }

    public function broadcastOn(): array
    {
        $outletId = $this->menu->category?->outlet_id;

        return $outletId
            ? [new Channel("public-outlet.{$outletId}.menu")]
            : [];
    }

    public function broadcastWith(): array
    {
        return [
            'menu_id' => $this->menu->id,
            'name' => $this->menu->name,
            'is_available' => $this->isAvailable,
        ];
    }
}

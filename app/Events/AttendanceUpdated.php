<?php

namespace App\Events;

use App\Models\Attendance;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class AttendanceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Attendance $attendance
    ) {}

    public function broadcastOn(): array
    {
        $outletId = $this->attendance->employee?->outlet_id;

        return $outletId
            ? [new PrivateChannel("outlet.{$outletId}.attendance")]
            : [];
    }
}

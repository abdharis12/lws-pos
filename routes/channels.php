<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('outlet.{outletId}.pos', function ($user, $outletId) {
    return $user instanceof User && $user->employee && $user->employee->outlet_id === (int) $outletId;
});

Broadcast::channel('outlet.{outletId}.kitchen', function ($user, $outletId) {
    return $user instanceof User && $user->employee && $user->employee->outlet_id === (int) $outletId;
});

Broadcast::channel('outlet.{outletId}.attendance', function ($user, $outletId) {
    return $user instanceof User && $user->employee && $user->employee->outlet_id === (int) $outletId;
});

// table.{token} is a public channel (see OrderStatusUpdated->broadcastOn()).
// No auth callback is required; Laravel skips channel authorization for public channels.

// public-outlet.{outletId}.menu — public channel, no auth callback needed

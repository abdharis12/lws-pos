<?php

use App\Models\Meja;
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

Broadcast::channel('table.{token}', function ($userOrGuest, $token) {
    if ($userOrGuest instanceof User) {
        return true;
    }

    $table = Meja::where('table_token', $token)->first();

    return $table !== null;
});

// public-outlet.{outletId}.menu — public channel, no auth callback needed

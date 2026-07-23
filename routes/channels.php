<?php

use App\Models\Meja;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('outlet.{outletId}.pos', function ($user, $outletId) {
    return $user->employee && $user->employee->outlet_id === (int) $outletId;
});

Broadcast::channel('outlet.{outletId}.kitchen', function ($user, $outletId) {
    return $user->employee && $user->employee->outlet_id === (int) $outletId;
});

Broadcast::channel('table.{token}', function ($userOrGuest, $token) {
    $table = Meja::where('table_token', $token)->first();

    return $table !== null;
});

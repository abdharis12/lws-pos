<?php

namespace App\Policies;

use App\Models\Outlet;
use App\Models\User;

class OutletPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function view(User $user, Outlet $outlet): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, Outlet $outlet): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }
}
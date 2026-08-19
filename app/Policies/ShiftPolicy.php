<?php

namespace App\Policies;

use App\Models\Shift;
use App\Models\User;

class ShiftPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function view(User $user, Shift $shift): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, Shift $shift): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, Shift $shift): bool
    {
        return $user->hasRole('Owner');
    }
}
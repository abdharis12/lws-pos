<?php

namespace App\Policies;

use App\Models\Meja;
use App\Models\User;

class MejaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Waiter']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, Meja $meja): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, Meja $meja): bool
    {
        return $user->hasRole('Owner');
    }

    public function regenerateToken(User $user, Meja $meja): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }
}

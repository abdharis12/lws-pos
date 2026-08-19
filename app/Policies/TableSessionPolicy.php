<?php

namespace App\Policies;

use App\Models\TableSession;
use App\Models\User;

class TableSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Waiter', 'Kitchen Staff']);
    }

    public function view(User $user, TableSession $session): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Waiter', 'Kitchen Staff']);
    }
}
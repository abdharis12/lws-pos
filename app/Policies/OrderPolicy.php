<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff']);
    }

    public function view(User $user, Order $order): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier']);
    }

    public function void(User $user, Order $order): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function applyDiscount(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier']);
    }

    public function applyLargeDiscount(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }
}

<?php

namespace App\Policies;

use App\Models\Menu;
use App\Models\User;

class MenuPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter']);
    }

    public function view(User $user, Menu $menu): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, Menu $menu): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, Menu $menu): bool
    {
        return $user->hasRole('Owner');
    }

    public function toggleAvailability(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier']);
    }
}

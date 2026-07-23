<?php

namespace App\Policies;

use App\Models\MenuCategory;
use App\Models\User;

class MenuCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, MenuCategory $category): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, MenuCategory $category): bool
    {
        return $user->hasRole('Owner');
    }
}

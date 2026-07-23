<?php

namespace App\Policies;

use App\Models\OptionGroup;
use App\Models\User;

class OptionGroupPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, OptionGroup $group): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, OptionGroup $group): bool
    {
        return $user->hasRole('Owner');
    }
}

<?php

namespace App\Policies;

use App\Models\User;

class SalaryComponentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }
}

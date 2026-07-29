<?php

namespace App\Policies;

use App\Models\User;

class OwnerDashboardPolicy
{
    public function view(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }
}

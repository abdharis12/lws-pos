<?php

namespace App\Policies;

use App\Models\User;

class PayslipPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function view(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }
}

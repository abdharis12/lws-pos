<?php

namespace App\Policies;

use App\Models\PosSession;
use App\Models\User;

class PosSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function view(User $user, PosSession $session): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function close(User $user, PosSession $session): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }
}
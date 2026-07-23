<?php

namespace App\Policies;

use App\Models\OptionItem;
use App\Models\User;

class OptionItemPolicy
{
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, OptionItem $item): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, OptionItem $item): bool
    {
        return $user->hasRole('Owner');
    }
}

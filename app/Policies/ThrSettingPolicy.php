<?php

namespace App\Policies;

use App\Models\ThrSetting;
use App\Models\User;

class ThrSettingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function view(User $user, ThrSetting $thrSetting): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, ThrSetting $thrSetting): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, ThrSetting $thrSetting): bool
    {
        return $user->hasRole('Owner');
    }
}
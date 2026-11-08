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
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter'])
            && $this->belongsToUserOutlet($user, $menu);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, Menu $menu): bool
    {
        return $user->hasRole('Owner')
            || ($user->hasRole('Admin') && $this->belongsToUserOutlet($user, $menu));
    }

    public function delete(User $user, Menu $menu): bool
    {
        return $user->hasRole('Owner');
    }

    public function toggleAvailability(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier']);
    }

    private function belongsToUserOutlet(User $user, Menu $menu): bool
    {
        if ($user->hasRole('Owner')) {
            return true;
        }

        $userOutletId = $user->employee?->outlet_id;

        return $userOutletId !== null
            && (int) $menu->category?->outlet_id === (int) $userOutletId;
    }
}

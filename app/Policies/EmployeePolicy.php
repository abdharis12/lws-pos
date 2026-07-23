<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function view(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, Employee $employee): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->hasRole('Owner');
    }
}

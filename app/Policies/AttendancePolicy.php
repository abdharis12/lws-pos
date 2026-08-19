<?php

namespace App\Policies;

use App\Models\Attendance;
use App\Models\User;

class AttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function view(User $user, Attendance $attendance): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']) || $attendance->employee->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function update(User $user, Attendance $attendance): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function delete(User $user, Attendance $attendance): bool
    {
        return $user->hasRole('Owner');
    }
}
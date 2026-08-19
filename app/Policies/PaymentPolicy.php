<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['Owner', 'Admin', 'Cashier']);
    }
}
<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Validation\ValidationException;

class DiscountService
{
    public function calculate(float $subtotal, ?string $type, mixed $value): float
    {
        if (empty($type) || empty($value)) {
            return 0;
        }

        $value = (float) $value;

        return round((match ($type) {
            'percentage' => min($subtotal * ($value / 100), $subtotal),
            'nominal' => min($value, $subtotal),
            default => 0,
        }) / 500) * 500;
    }

    public function needsApproval(float $subtotal, ?string $type, mixed $value): bool
    {
        if (empty($type) || empty($value)) {
            return false;
        }

        $value = (float) $value;
        $config = config('pos.discount');

        return match ($type) {
            'percentage' => $value > $config['percentage_threshold'],
            'nominal' => $value > $config['nominal_threshold'],
            default => false,
        };
    }

    public function validateApproval(array $validated): void
    {
        if (empty($validated['discount_approved_by'])) {
            throw ValidationException::withMessages([
                'discount' => 'Diskon besar memerlukan persetujuan Admin/Owner.',
            ]);
        }

        $approver = User::find($validated['discount_approved_by']);
        if (! $approver || ! $approver->hasAnyRole(['Admin', 'Owner'])) {
            throw ValidationException::withMessages([
                'discount' => 'Hanya Admin atau Owner yang dapat menyetujui diskon besar.',
            ]);
        }
    }
}

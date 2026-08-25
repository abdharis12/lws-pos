<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    public const TIER_BRONZE = 'bronze';

    public const TIER_SILVER = 'silver';

    public const TIER_GOLD = 'gold';

    public const TIER_PLATINUM = 'platinum';

    public const TIER_THRESHOLDS = [
        self::TIER_BRONZE => 0,
        self::TIER_SILVER => 1_000_000,
        self::TIER_GOLD => 5_000_000,
        self::TIER_PLATINUM => 15_000_000,
    ];

    public const POINTS_PER_1000_SPEND = 1;

    protected $fillable = [
        'outlet_id', 'user_id', 'name', 'phone', 'email', 'birthdate',
        'tier', 'points', 'total_spend', 'visit_count',
        'preferences', 'allergens', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'total_spend' => 'decimal:2',
            'points' => 'integer',
            'visit_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function promoUsages(): HasMany
    {
        return $this->hasMany(PromoUsage::class);
    }

    public function calculateTier(?float $totalSpend = null): string
    {
        $spend = $totalSpend ?? (float) $this->total_spend;
        $tier = self::TIER_BRONZE;

        foreach (self::TIER_THRESHOLDS as $candidate => $threshold) {
            if ($spend >= $threshold) {
                $tier = $candidate;
            }
        }

        return $tier;
    }

    public function refreshTier(): void
    {
        $this->update(['tier' => $this->calculateTier()]);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Promo extends Model
{
    use HasFactory;

    public const TYPE_PERCENT = 'percent';

    public const TYPE_NOMINAL = 'nominal';

    public const TYPE_BUY_X_GET_Y = 'buy_x_get_y';

    public const CHANNEL_ALL = 'all';

    public const CHANNEL_POS = 'pos';

    public const CHANNEL_SELF_ORDER = 'self_order';

    protected $fillable = [
        'outlet_id', 'code', 'name', 'type', 'value',
        'min_spend', 'max_discount', 'valid_from', 'valid_to',
        'usage_limit', 'usage_count', 'usage_limit_per_customer',
        'channel', 'description', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_spend' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'valid_from' => 'date',
            'valid_to' => 'date',
            'usage_count' => 'integer',
            'usage_limit' => 'integer',
            'usage_limit_per_customer' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(PromoUsage::class);
    }

    public function isValid(?string $channel = null): bool
    {
        $today = now()->startOfDay();

        if (! $this->is_active) {
            return false;
        }

        if ($today->lt($this->valid_from) || $today->gt($this->valid_to)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->usage_count >= $this->usage_limit) {
            return false;
        }

        if ($channel !== null && $this->channel !== self::CHANNEL_ALL && $this->channel !== $channel) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(float $amount): float
    {
        if ($amount < (float) $this->min_spend) {
            return 0.0;
        }

        $discount = match ($this->type) {
            self::TYPE_PERCENT => $amount * ((float) $this->value / 100),
            self::TYPE_NOMINAL, self::TYPE_BUY_X_GET_Y => (float) $this->value,
            default => 0.0,
        };

        if ($this->max_discount !== null) {
            $discount = min($discount, (float) $this->max_discount);
        }

        return round(min($discount, $amount), 2);
    }
}

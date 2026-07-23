<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OptionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'option_group_id', 'name', 'price_adjustment',
        'is_available', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_adjustment' => 'decimal:2',
            'is_available' => 'boolean',
        ];
    }

    public function optionGroup(): BelongsTo
    {
        return $this->belongsTo(OptionGroup::class);
    }
}

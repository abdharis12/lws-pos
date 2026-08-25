<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuRecipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_id', 'ingredient_id', 'quantity_per_portion', 'unit', 'yield_percentage', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity_per_portion' => 'decimal:4',
            'yield_percentage' => 'decimal:2',
        ];
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function getEffectiveCostAttribute(): float
    {
        if ($this->yield_percentage <= 0) {
            return 0;
        }

        return ($this->ingredient->cost_per_unit * $this->quantity_per_portion) / ($this->yield_percentage / 100);
    }
}

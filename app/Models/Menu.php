<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'name', 'description', 'price', 'cost',
        'photo_path', 'is_available', 'station',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'cost' => 'decimal:4',
            'is_available' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function optionGroups(): BelongsToMany
    {
        return $this->belongsToMany(OptionGroup::class, 'menu_option_group');
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(MenuRecipe::class);
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'menu_recipes')
            ->withPivot('quantity_per_portion', 'unit', 'yield_percentage', 'notes')
            ->withTimestamps();
    }

    public function calculateHpp(): float
    {
        $this->loadMissing('recipes.ingredient');

        return $this->recipes->sum(fn (MenuRecipe $recipe) => $recipe->effective_cost);
    }

    public function updateCostFromRecipes(): void
    {
        $this->update(['cost' => $this->calculateHpp()]);
    }

    public function getMarginAttribute(): float
    {
        if ($this->price <= 0) {
            return 0;
        }

        return (($this->price - $this->cost) / $this->price) * 100;
    }

    public function getMarginAmountAttribute(): float
    {
        return $this->price - $this->cost;
    }
}

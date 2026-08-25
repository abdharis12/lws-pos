<?php

namespace App\Events;

use App\Models\Ingredient;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IngredientCostChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ?Ingredient $ingredient;

    public function __construct(
        public int $ingredientId,
        public int $outletId,
        public float $oldCost,
        public float $newCost,
        ?Ingredient $ingredient = null
    ) {
        $this->ingredient = $ingredient;
    }

    public function hasCostChanged(): bool
    {
        return $this->oldCost !== $this->newCost;
    }
}

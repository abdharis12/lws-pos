<?php

namespace Database\Factories;

use App\Models\Ingredient;
use App\Models\PurchaseOrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrderItem>
 */
class PurchaseOrderItemFactory extends Factory
{
    protected $model = PurchaseOrderItem::class;

    public function definition(): array
    {
        return [
            'po_id' => 1,
            'ingredient_id' => Ingredient::factory(),
            'qty_ordered' => fake()->numberBetween(5, 50),
            'qty_received' => 0,
            'unit_cost' => fake()->randomFloat(4, 1000, 50000),
        ];
    }
}

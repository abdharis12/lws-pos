<?php

namespace Database\Factories;

use App\Models\Ingredient;
use App\Models\Outlet;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockMovement>
 */
class StockMovementFactory extends Factory
{
    public function definition(): array
    {
        $qty = fake()->randomFloat(4, 1, 50);

        return [
            'outlet_id' => Outlet::factory(),
            'ingredient_id' => Ingredient::factory(),
            'type' => 'in',
            'qty' => $qty,
            'unit_cost' => fake()->randomFloat(4, 1000, 50000),
            'total_cost' => fn (array $attributes) => $attributes['qty'] * $attributes['unit_cost'],
            'notes' => fake()->sentence(),
        ];
    }

    public function out(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'out',
            'qty' => -abs((float) ($attributes['qty'] ?? 1)),
        ]);
    }

    public function waste(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'waste',
            'qty' => -abs((float) ($attributes['qty'] ?? 1)),
        ]);
    }
}

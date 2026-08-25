<?php

namespace Database\Factories;

use App\Models\Ingredient;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ingredient>
 */
class IngredientFactory extends Factory
{
    private static array $names = [
        'Beras', 'Ayam Fillet', 'Daging Sapi', 'Telur Ayam', 'Santan',
        'Kacang Tanah', 'Bawang Merah', 'Bawang Putih', 'Gula Pasir',
        'Minyak Goreng', 'Tepung Beras', 'Daun Pandan', 'Garam',
    ];

    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'name' => fake()->unique()->randomElement(self::$names),
            'unit' => fake()->randomElement(['kg', 'pcs', 'liter', 'gram']),
            'cost_per_unit' => fake()->randomFloat(4, 1000, 50000),
            'current_stock' => fake()->randomFloat(4, 10, 100),
            'min_stock' => fake()->randomFloat(4, 1, 5),
            'is_active' => true,
        ];
    }

    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'current_stock' => 2,
            'min_stock' => 5,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'current_stock' => 0,
            'min_stock' => 5,
        ]);
    }
}

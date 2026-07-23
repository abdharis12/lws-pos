<?php

namespace Database\Factories;

use App\Models\MenuCategory;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuCategory>
 */
class MenuCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'name' => fake()->randomElement(['Makanan', 'Minuman', 'Snack', 'Promo']),
            'sort_order' => fake()->numberBetween(1, 10),
            'is_active' => true,
        ];
    }
}

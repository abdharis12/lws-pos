<?php

namespace Database\Factories;

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\MenuRecipe;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuRecipe>
 */
class MenuRecipeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'menu_id' => Menu::factory(),
            'ingredient_id' => Ingredient::factory(),
            'quantity_per_portion' => fake()->randomFloat(4, 0.05, 0.5),
            'unit' => 'kg',
            'yield_percentage' => 100,
            'notes' => null,
        ];
    }
}

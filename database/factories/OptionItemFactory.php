<?php

namespace Database\Factories;

use App\Models\OptionGroup;
use App\Models\OptionItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OptionItem>
 */
class OptionItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'option_group_id' => OptionGroup::factory(),
            'name' => fake()->word(),
            'price_adjustment' => fake()->randomFloat(2, 0, 10000),
            'is_available' => true,
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\OptionGroup;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OptionGroup>
 */
class OptionGroupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'name' => fake()->randomElement(['Level Pedas', 'Topping', 'Ukuran', 'Ekstra']),
            'selection_type' => fake()->randomElement(['single', 'multiple']),
            'is_required' => false,
            'min_select' => 0,
            'max_select' => 5,
            'is_active' => true,
        ];
    }
}

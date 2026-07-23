<?php

namespace Database\Factories;

use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Outlet>
 */
class OutletFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Outlet',
            'address' => fake()->address(),
            'phone' => fake()->phoneNumber(),
            'code' => strtoupper(fake()->bothify('??##')),
            'is_active' => true,
        ];
    }
}

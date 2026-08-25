<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'name' => fake()->name(),
            'phone' => '08'.fake()->numerify('##########'),
            'email' => fake()->optional()->safeEmail(),
            'birthdate' => fake()->optional(0.8)->dateTimeBetween('-60 years', '-18 years')?->format('Y-m-d'),
            'tier' => Customer::TIER_BRONZE,
            'points' => 0,
            'total_spend' => 0,
            'visit_count' => 0,
            'is_active' => true,
        ];
    }
}

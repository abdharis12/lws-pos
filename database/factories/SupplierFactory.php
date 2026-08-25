<?php

namespace Database\Factories;

use App\Models\Outlet;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'name' => fake()->company(),
            'contact_person' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'address' => fake()->address(),
            'payment_terms' => fake()->randomElement(['cash', 'net_7', 'net_14', 'net_30']),
            'lead_time_days' => fake()->numberBetween(1, 7),
            'is_active' => true,
        ];
    }
}

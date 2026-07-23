<?php

namespace Database\Factories;

use App\Models\Meja;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Meja>
 */
class MejaFactory extends Factory
{
    protected $model = Meja::class;

    public function definition(): array
    {
        return [
            'outlet_id' => Outlet::factory(),
            'code' => strtoupper(fake()->bothify('T??##')),
            'table_token' => Str::random(40),
            'capacity' => fake()->numberBetween(2, 8),
            'status' => fake()->randomElement(['available', 'occupied', 'reserved']),
        ];
    }
}

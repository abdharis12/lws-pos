<?php

namespace Database\Factories;

use App\Models\Meja;
use App\Models\TableSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TableSession>
 */
class TableSessionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'table_id' => Meja::factory(),
            'opened_at' => fake()->dateTimeBetween('-1 day', 'now'),
            'closed_at' => null,
            'status' => fake()->randomElement(['active', 'closed']),
        ];
    }
}

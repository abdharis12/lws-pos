<?php

namespace Database\Factories;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'action' => fake()->randomElement(['created', 'updated', 'deleted', 'login', 'logout']),
            'subject_type' => fake()->randomElement(['App\Models\Order', 'App\Models\Menu', 'App\Models\Employee']),
            'subject_id' => fake()->numberBetween(1, 100),
            'description' => fake()->sentence(),
            'metadata' => [],
        ];
    }
}

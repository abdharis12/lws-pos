<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\Shift;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Shift>
 */
class ShiftFactory extends Factory
{
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'shift_date' => fake()->date(),
            'start_time' => fake()->randomElement(['06:00', '07:00', '08:00', '14:00', '15:00']),
            'end_time' => fake()->randomElement(['14:00', '15:00', '16:00', '22:00', '23:00']),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendance>
 */
class AttendanceFactory extends Factory
{
    public function definition(): array
    {
        $clockIn = fake()->dateTimeBetween('-1 month', 'now');

        return [
            'employee_id' => Employee::factory(),
            'clock_in_at' => $clockIn,
            'clock_out_at' => (clone $clockIn)->modify('+'.fake()->numberBetween(6, 12).' hours'),
            'photo_path_in' => null,
            'photo_path_out' => null,
            'latitude_in' => fake()->latitude(-6.3, -6.1),
            'longitude_in' => fake()->longitude(106.7, 106.9),
            'latitude_out' => fake()->latitude(-6.3, -6.1),
            'longitude_out' => fake()->longitude(106.7, 106.9),
            'status' => fake()->randomElement(['present', 'late', 'absent']),
        ];
    }
}

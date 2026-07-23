<?php

namespace Database\Factories;

use App\Models\Deduction;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Deduction>
 */
class DeductionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'period' => fake()->date('Y-m'),
            'type' => fake()->randomElement(['bpjs', 'pinjaman', 'telat', 'denda']),
            'amount' => fake()->randomFloat(2, 50000, 500000),
            'notes' => fake()->sentence(),
        ];
    }
}

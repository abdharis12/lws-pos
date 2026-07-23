<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\SalaryComponent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalaryComponent>
 */
class SalaryComponentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'base_salary' => fake()->randomFloat(2, 2000000, 8000000),
            'salary_type' => 'monthly',
            'meal_allowance' => fake()->randomFloat(2, 300000, 600000),
            'transport_allowance' => fake()->randomFloat(2, 200000, 500000),
            'overtime_rate_per_hour' => fake()->randomFloat(2, 15000, 30000),
        ];
    }
}

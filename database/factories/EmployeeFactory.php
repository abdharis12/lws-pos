<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'outlet_id' => Outlet::factory(),
            'phone' => fake()->phoneNumber(),
            'position' => fake()->randomElement(['kasir', 'dapur', 'waiter', 'admin']),
            'join_date' => fake()->dateTimeBetween('-2 years', 'now'),
            'base_salary' => fake()->randomFloat(2, 2000000, 8000000),
            'salary_type' => 'monthly',
            'is_active' => true,
        ];
    }
}

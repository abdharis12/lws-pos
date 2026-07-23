<?php

namespace Database\Factories;

use App\Models\Bonus;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bonus>
 */
class BonusFactory extends Factory
{
    public function definition(): array
    {
        return [
            'employee_id' => Employee::factory(),
            'period' => fake()->date('Y-m'),
            'amount' => fake()->randomFloat(2, 100000, 1000000),
            'reason' => fake()->randomElement(['Lembur', 'Pelayanan Terbaik', 'Penjualan Tertinggi', 'Tunjangan Hari Raya']),
            'approved_by' => User::factory(),
        ];
    }
}

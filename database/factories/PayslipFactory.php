<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\Payslip;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payslip>
 */
class PayslipFactory extends Factory
{
    public function definition(): array
    {
        $baseSalary = fake()->randomFloat(2, 2000000, 8000000);
        $allowances = fake()->randomFloat(2, 500000, 1500000);
        $meal = round($allowances * 0.6, 2);
        $transport = round($allowances - $meal, 2);
        $bonus = fake()->randomFloat(2, 0, 500000);
        $overtime = fake()->randomFloat(2, 0, 300000);
        $deductions = fake()->randomFloat(2, 100000, 400000);
        $takeHome = $baseSalary + $allowances + $bonus + $overtime - $deductions;

        return [
            'employee_id' => Employee::factory(),
            'period' => fake()->date('Y-m'),
            'base_salary' => $baseSalary,
            'allowances_total' => $allowances,
            'meal_allowance' => $meal,
            'transport_allowance' => $transport,
            'bonus_total' => $bonus,
            'overtime_total' => $overtime,
            'deduction_total' => $deductions,
            'take_home_pay' => $takeHome,
            'status' => fake()->randomElement(['draft', 'approved', 'paid']),
        ];
    }
}

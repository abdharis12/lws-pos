<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Payslip;
use App\Models\SalaryComponent;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class PayrollService
{
    public function generatePayslips(string $period): Collection
    {
        [$year, $month] = explode('-', $period);
        $startDate = Carbon::create((int) $year, (int) $month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        $employees = Employee::with([
            'salaryComponent',
            'bonuses' => fn ($q) => $q->where('period', $period),
            'deductions' => fn ($q) => $q->where('period', $period),
            'attendances' => fn ($q) => $q->whereBetween('clock_in_at', [$startDate, $endDate]),
            'shifts' => fn ($q) => $q->whereYear('shift_date', (int) $year)->whereMonth('shift_date', (int) $month),
        ])
            ->where('is_active', true)
            ->get();

        return $employees
            ->map(fn (Employee $employee) => $this->buildForEmployee($employee, $period, $startDate, $endDate))
            ->filter();
    }

    public function generateForEmployee(Employee $employee, string $period, ?Carbon $startDate = null, ?Carbon $endDate = null): ?Payslip
    {
        if (! $startDate) {
            [$year, $month] = explode('-', $period);
            $startDate = Carbon::create((int) $year, (int) $month, 1);
            $endDate = $startDate->copy()->endOfMonth();
        }

        $employee->load([
            'salaryComponent',
            'bonuses' => fn ($q) => $q->where('period', $period),
            'deductions' => fn ($q) => $q->where('period', $period),
            'attendances' => fn ($q) => $q->whereBetween('clock_in_at', [$startDate, $endDate]),
            'shifts' => fn ($q) => $q->whereYear('shift_date', (int) $startDate->year)->whereMonth('shift_date', (int) $startDate->month),
        ]);

        return $this->buildForEmployee($employee, $period, $startDate, $endDate);
    }

    protected function buildForEmployee(Employee $employee, string $period, Carbon $startDate, Carbon $endDate): ?Payslip
    {
        $salaryComponent = $employee->salaryComponent;
        if (! $salaryComponent) {
            return null;
        }

        $baseSalary = (float) $salaryComponent->base_salary;
        $salaryType = $salaryComponent->salary_type;

        $attendances = $employee->attendances;
        $totalWorkDays = $attendances->count();
        $totalWorkHours = $attendances->sum(fn ($a) => $a->clock_in_at && $a->clock_out_at
            ? $a->clock_in_at->diffInHours($a->clock_out_at) : 0);

        $mealAllowance = (float) $salaryComponent->meal_allowance;
        $transportAllowance = (float) $salaryComponent->transport_allowance;

        if ($salaryType === 'daily') {
            $mealAllowance *= $totalWorkDays;
            $transportAllowance *= $totalWorkDays;
        }

        $allowancesTotal = $mealAllowance + $transportAllowance;

        $overtimeTotal = $this->calculateOvertime($employee, $attendances, $salaryComponent, $period);

        $bonusTotal = (float) $employee->bonuses->sum('amount');
        $deductionTotal = (float) $employee->deductions->sum('amount');

        $takeHomePay = $baseSalary + $allowancesTotal + $overtimeTotal + $bonusTotal - $deductionTotal;

        $status = 'draft';

        $existing = Payslip::where('employee_id', $employee->id)
            ->where('period', $period)
            ->first();

        if ($existing && $existing->status === 'paid') {
            $status = 'paid';
        }

        return Payslip::updateOrCreate(
            ['employee_id' => $employee->id, 'period' => $period],
            [
                'base_salary' => $baseSalary,
                'allowances_total' => $allowancesTotal,
                'meal_allowance' => $mealAllowance,
                'transport_allowance' => $transportAllowance,
                'bonus_total' => $bonusTotal,
                'overtime_total' => $overtimeTotal,
                'deduction_total' => $deductionTotal,
                'take_home_pay' => max(0, $takeHomePay),
                'status' => $status,
            ]
        );
    }

    protected function calculateOvertime(Employee $employee, Collection $attendances, SalaryComponent $component, string $period): float
    {
        $rate = (float) $component->overtime_rate_per_hour;
        if ($rate <= 0) {
            return 0;
        }

        $shifts = $employee->shifts->keyBy(fn ($s) => $s->shift_date->format('Y-m-d'));
        $totalOvertimeHours = 0;

        foreach ($attendances as $attendance) {
            if (! $attendance->clock_in_at || ! $attendance->clock_out_at) {
                continue;
            }

            $dateKey = $attendance->clock_in_at->format('Y-m-d');
            $shift = $shifts->get($dateKey);
            if (! $shift) {
                continue;
            }

            $scheduledEnd = Carbon::parse($dateKey.' '.$shift->end_time);
            if ($attendance->clock_out_at->gt($scheduledEnd)) {
                $totalOvertimeHours += $scheduledEnd->diffInHours($attendance->clock_out_at, false);
            }
        }

        return $totalOvertimeHours * $rate;
    }
}

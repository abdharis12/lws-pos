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
        $payslips = collect();

        $employees = Employee::with(['salaryComponent', 'bonuses', 'deductions', 'attendances', 'shifts'])
            ->where('is_active', true)
            ->get();

        foreach ($employees as $employee) {
            $payslip = $this->generateForEmployee($employee, $period, $startDate, $endDate);
            if ($payslip) {
                $payslips->push($payslip);
            }
        }

        return $payslips;
    }

    public function generateForEmployee(Employee $employee, string $period, ?Carbon $startDate = null, ?Carbon $endDate = null): ?Payslip
    {
        if (! $startDate) {
            [$year, $month] = explode('-', $period);
            $startDate = Carbon::create((int) $year, (int) $month, 1);
            $endDate = $startDate->copy()->endOfMonth();
        }

        $salaryComponent = $employee->salaryComponent;

        if (! $salaryComponent) {
            return null;
        }

        $baseSalary = (float) $salaryComponent->base_salary;
        $salaryType = $salaryComponent->salary_type;

        $attendances = $employee->attendances()
            ->whereDate('clock_in_at', '>=', $startDate)
            ->whereDate('clock_in_at', '<=', $endDate)
            ->get();

        $totalWorkDays = $attendances->count();
        $totalWorkHours = $attendances->sum(fn ($a) => $a->clock_in_at && $a->clock_out_at
            ? $a->clock_in_at->diffInHours($a->clock_out_at) : 0);

        $allowancesTotal = $this->calculateAllowances($salaryComponent, $salaryType, $totalWorkDays);

        $overtimeTotal = $this->calculateOvertime($employee, $attendances, $salaryComponent, $period);

        $bonusTotal = (float) $employee->bonuses()
            ->where('period', $period)
            ->sum('amount');

        $deductionTotal = (float) $employee->deductions()
            ->where('period', $period)
            ->sum('amount');

        $takeHomePay = $baseSalary + $allowancesTotal + $overtimeTotal + $bonusTotal - $deductionTotal;

        return Payslip::updateOrCreate(
            ['employee_id' => $employee->id, 'period' => $period],
            [
                'base_salary' => $baseSalary,
                'allowances_total' => $allowancesTotal,
                'bonus_total' => $bonusTotal,
                'overtime_total' => $overtimeTotal,
                'deduction_total' => $deductionTotal,
                'take_home_pay' => max(0, $takeHomePay),
                'status' => 'draft',
            ]
        );
    }

    protected function calculateAllowances(SalaryComponent $component, string $salaryType, int $workDays): float
    {
        $meal = (float) $component->meal_allowance;
        $transport = (float) $component->transport_allowance;

        if ($salaryType === 'daily') {
            return ($meal + $transport) * $workDays;
        }

        return $meal + $transport;
    }

    protected function calculateOvertime(Employee $employee, Collection $attendances, SalaryComponent $component, string $period): float
    {
        $rate = (float) $component->overtime_rate_per_hour;
        if ($rate <= 0) {
            return 0;
        }

        $totalOvertimeHours = 0;
        $shifts = $employee->shifts()
            ->whereYear('shift_date', explode('-', $period)[0])
            ->whereMonth('shift_date', explode('-', $period)[1])
            ->get()
            ->keyBy(fn ($s) => $s->shift_date->format('Y-m-d'));

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
            $actualEnd = $attendance->clock_out_at;

            if ($actualEnd->gt($scheduledEnd)) {
                $totalOvertimeHours += $scheduledEnd->diffInHours($actualEnd, false);
            }
        }

        return $totalOvertimeHours * $rate;
    }
}

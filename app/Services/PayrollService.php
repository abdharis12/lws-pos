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
            'shifts' => fn ($q) => $q->whereBetween('shift_date', [$startDate, $endDate]),
        ])
            ->where('is_active', true)
            ->get();

        $existingStatuses = Payslip::where('period', $period)
            ->whereIn('employee_id', $employees->pluck('id'))
            ->pluck('status', 'employee_id');

        return $employees
            ->map(fn (Employee $employee) => $this->buildForEmployee(
                $employee,
                $period,
                $startDate,
                $endDate,
                $existingStatuses[$employee->id] ?? null,
            ))
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
            'shifts' => fn ($q) => $q->whereBetween('shift_date', [$startDate, $endDate]),
        ]);

        return $this->buildForEmployee($employee, $period, $startDate, $endDate);
    }

    protected function buildForEmployee(Employee $employee, string $period, Carbon $startDate, Carbon $endDate, ?string $existingStatus = null): ?Payslip
    {
        $component = $employee->salaryComponent;
        if (! $component) {
            return null;
        }

        $attendances = $employee->attendances;
        $workDays = $attendances->count();
        $workHours = $this->workHours($attendances);
        $allowances = $this->buildAllowances($component, $workDays);
        $baseSalary = (float) $component->base_salary;
        $overtime = (float) $this->calculateOvertime($employee, $attendances, $component, $period);
        $bonus = (float) $employee->bonuses->sum('amount');
        $deduction = (float) $employee->deductions->sum('amount');
        $takeHome = max(0, $baseSalary + $allowances['total'] + $overtime + $bonus - $deduction);
        $status = $existingStatus ?? $this->payslipStatus($employee, $period);

        return Payslip::updateOrCreate(
            ['employee_id' => $employee->id, 'period' => $period],
            $this->payslipData($component, $baseSalary, $allowances, $overtime, $bonus, $deduction, $takeHome, $status ?? 'draft', $period),
        );
    }

    protected function buildAllowances(SalaryComponent $component, int $workDays): array
    {
        $meal = (float) $component->meal_allowance;
        $transport = (float) $component->transport_allowance;

        if ($component->salary_type === 'daily') {
            $meal *= $workDays;
            $transport *= $workDays;
        }

        return ['meal' => $meal, 'transport' => $transport, 'total' => $meal + $transport];
    }

    protected function payslipStatus(Employee $employee, string $period): string
    {
        $existing = Payslip::where('employee_id', $employee->id)->where('period', $period)->first();

        return $existing && $existing->status === 'paid' ? 'paid' : 'draft';
    }

    protected function workHours(Collection $attendances): int
    {
        return $attendances->sum(fn ($a) => $a->clock_in_at && $a->clock_out_at
            ? $a->clock_in_at->diffInHours($a->clock_out_at) : 0);
    }

    protected function payslipData(SalaryComponent $component, float $baseSalary, array $allowances, float $overtime, float $bonus, float $deduction, float $takeHome, string $status, string $period): array
    {
        return [
            'base_salary' => $baseSalary,
            'allowances_total' => $allowances['total'],
            'meal_allowance' => $allowances['meal'],
            'transport_allowance' => $allowances['transport'],
            'bonus_total' => $bonus,
            'overtime_total' => $overtime,
            'deduction_total' => $deduction,
            'take_home_pay' => $takeHome,
            'status' => $status,
        ];
    }

    protected function calculateOvertime(Employee $employee, Collection $attendances, SalaryComponent $component, string $period): float
    {
        $rate = (float) $component->overtime_rate_per_hour;
        if ($rate <= 0) {
            return 0;
        }

        $employee->loadMissing('shifts');
        $shifts = $employee->shifts->keyBy(fn ($s) => $s->shift_date->format('Y-m-d'));
        $totalHours = $attendances->reduce(fn (float $carry, $attendance) => $carry + $this->attendanceExtraHours($attendance, $shifts), 0.0);

        return $totalHours * $rate;
    }

    protected function attendanceExtraHours($attendance, Collection $shifts): float
    {
        if (! $attendance->clock_in_at || ! $attendance->clock_out_at) {
            return 0;
        }

        $dateKey = $attendance->clock_in_at->format('Y-m-d');
        $shift = $shifts->get($dateKey);
        if (! $shift) {
            return 0;
        }

        $scheduledEnd = Carbon::parse($dateKey.' '.$shift->end_time);

        return $attendance->clock_out_at->gt($scheduledEnd)
            ? $scheduledEnd->diffInHours($attendance->clock_out_at, false)
            : 0;
    }
}

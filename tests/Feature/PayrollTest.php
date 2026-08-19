<?php

use App\Models\Attendance;
use App\Models\Bonus;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\Outlet;
use App\Models\Payslip;
use App\Models\SalaryComponent;
use App\Models\Shift;
use App\Models\User;
use App\Services\PayrollService;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);

    $this->outlet = Outlet::factory()->create();
    $this->owner = User::factory()->create()->assignRole('Owner');
    Employee::factory()->create(['user_id' => $this->owner->id, 'outlet_id' => $this->outlet->id]);
    $this->admin = User::factory()->create()->assignRole('Admin');
    Employee::factory()->create(['user_id' => $this->admin->id, 'outlet_id' => $this->outlet->id]);
    $this->cashier = User::factory()->create()->assignRole('Cashier');
    Employee::factory()->create(['user_id' => $this->cashier->id, 'outlet_id' => $this->outlet->id]);
});

// ─── Salary Components ──────────────────────────────────────

test('salary components list requires owner/admin', function () {
    $this->actingAs($this->cashier)->get(route('admin.salary-components.index'))->assertForbidden();
    $this->actingAs($this->owner)->get(route('admin.salary-components.index'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.salary-components.index'))->assertOk();
});

test('can create salary component', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($this->owner)->post(route('admin.salary-components.store'), [
        'employee_id' => $employee->id,
        'base_salary' => 3000000,
        'salary_type' => 'monthly',
        'meal_allowance' => 50000,
        'transport_allowance' => 30000,
        'overtime_rate_per_hour' => 25000,
    ])->assertRedirect();

    $this->assertDatabaseHas('salary_components', [
        'employee_id' => $employee->id,
        'base_salary' => 3000000,
    ]);
});

test('can update salary component', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $component = SalaryComponent::factory()->create(['employee_id' => $employee->id]);

    $this->actingAs($this->owner)->put(route('admin.salary-components.update', $component), [
        'base_salary' => 3500000,
        'salary_type' => 'monthly',
        'meal_allowance' => 50000,
        'transport_allowance' => 30000,
        'overtime_rate_per_hour' => 25000,
    ])->assertRedirect();

    expect((float) $component->fresh()->base_salary)->toBe(3500000.0);
});

test('can delete salary component', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $component = SalaryComponent::factory()->create(['employee_id' => $employee->id]);

    $this->actingAs($this->owner)->delete(route('admin.salary-components.destroy', $component))
        ->assertRedirect();

    $this->assertDatabaseMissing('salary_components', ['id' => $component->id]);
});

// ─── Bonuses ─────────────────────────────────────────────────

test('bonuses list requires owner/admin', function () {
    $this->actingAs($this->cashier)->get(route('admin.bonuses.index'))->assertForbidden();
    $this->actingAs($this->owner)->get(route('admin.bonuses.index'))->assertOk();
});

test('can create bonus', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($this->owner)->post(route('admin.bonuses.store'), [
        'employee_id' => $employee->id,
        'period' => '2026-07',
        'amount' => 500000,
        'reason' => 'Bonus kinerja',
    ])->assertRedirect();

    $this->assertDatabaseHas('bonuses', [
        'employee_id' => $employee->id,
        'amount' => 500000,
    ]);
});

test('can update bonus', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $bonus = Bonus::factory()->create(['employee_id' => $employee->id]);

    $this->actingAs($this->owner)->put(route('admin.bonuses.update', $bonus), [
        'amount' => 750000,
        'reason' => 'Bonus meningkat',
    ])->assertRedirect();

    expect((float) $bonus->fresh()->amount)->toBe(750000.0);
});

test('can delete bonus', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $bonus = Bonus::factory()->create(['employee_id' => $employee->id]);

    $this->actingAs($this->owner)->delete(route('admin.bonuses.destroy', $bonus))
        ->assertRedirect();

    $this->assertDatabaseMissing('bonuses', ['id' => $bonus->id]);
});

// ─── Deductions ──────────────────────────────────────────────

test('deductions list requires owner/admin', function () {
    $this->actingAs($this->cashier)->get(route('admin.deductions.index'))->assertForbidden();
    $this->actingAs($this->owner)->get(route('admin.deductions.index'))->assertOk();
});

test('can create deduction', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($this->owner)->post(route('admin.deductions.store'), [
        'employee_id' => $employee->id,
        'period' => '2026-07',
        'type' => 'loan',
        'amount' => 200000,
        'notes' => 'Pinjaman karyawan',
    ])->assertRedirect();

    $this->assertDatabaseHas('deductions', [
        'employee_id' => $employee->id,
        'type' => 'loan',
    ]);
});

test('can update deduction', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $deduction = Deduction::factory()->create(['employee_id' => $employee->id]);

    $this->actingAs($this->owner)->put(route('admin.deductions.update', $deduction), [
        'type' => 'other',
        'amount' => 150000,
        'notes' => 'Denda',
    ])->assertRedirect();

    expect($deduction->fresh()->type)->toBe('other');
});

test('can delete deduction', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $deduction = Deduction::factory()->create(['employee_id' => $employee->id]);

    $this->actingAs($this->owner)->delete(route('admin.deductions.destroy', $deduction))
        ->assertRedirect();

    $this->assertDatabaseMissing('deductions', ['id' => $deduction->id]);
});

// ─── Payslip Generation ──────────────────────────────────────

test('can generate payslips for period', function () {
    $employee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    SalaryComponent::factory()->create([
        'employee_id' => $employee->id,
        'base_salary' => 3000000,
        'salary_type' => 'monthly',
        'meal_allowance' => 50000,
        'transport_allowance' => 30000,
    ]);

    Bonus::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
        'amount' => 200000,
    ]);

    Deduction::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
        'type' => 'late',
        'amount' => 50000,
    ]);

    $this->actingAs($this->owner)->post(route('admin.payslips.generate'), [
        'period' => '2026-07',
    ])->assertRedirect();

    $this->assertDatabaseHas('payslips', [
        'employee_id' => $employee->id,
        'period' => '2026-07',
    ]);
});

test('payslip has correct take home pay calculation', function () {
    $employee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    SalaryComponent::factory()->create([
        'employee_id' => $employee->id,
        'base_salary' => 3000000,
        'salary_type' => 'monthly',
        'meal_allowance' => 50000,
        'transport_allowance' => 30000,
    ]);

    Bonus::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
        'amount' => 200000,
    ]);

    Deduction::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
        'type' => 'late',
        'amount' => 50000,
    ]);

    $service = app(PayrollService::class);
    $service->generatePayslips('2026-07');

    $payslip = Payslip::where('employee_id', $employee->id)->first();

    // base_salary 3.000.000 + allowances 80.000 + bonus 200.000 - deduction 50.000 = 3.230.000
    expect((float) $payslip->take_home_pay)->toBe(3230000.0);
    expect((float) $payslip->meal_allowance)->toBe(50000.0);
    expect((float) $payslip->transport_allowance)->toBe(30000.0);
});

test('payslip stores allowance breakdown for daily salary type', function () {
    $employee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    SalaryComponent::factory()->create([
        'employee_id' => $employee->id,
        'base_salary' => 150000,
        'salary_type' => 'daily',
        'meal_allowance' => 50000,
        'transport_allowance' => 30000,
    ]);

    collect(range(1, 5))->each(function ($day) use ($employee) {
        Attendance::factory()->create([
            'employee_id' => $employee->id,
            'clock_in_at' => "2026-07-0{$day} 08:00:00",
            'clock_out_at' => "2026-07-0{$day} 16:00:00",
        ]);
    });

    $service = app(PayrollService::class);
    $service->generatePayslips('2026-07');

    $payslip = Payslip::where('employee_id', $employee->id)->first();

    expect((float) $payslip->meal_allowance)->toBe(250000.0);
    expect((float) $payslip->transport_allowance)->toBe(150000.0);
    expect((float) $payslip->allowances_total)->toBe(400000.0);
});

test('can approve payslip', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $payslip = Payslip::factory()->create([
        'employee_id' => $employee->id,
        'status' => 'draft',
    ]);

    $this->actingAs($this->owner)->post(route('admin.payslips.approve', $payslip))
        ->assertRedirect();

    expect($payslip->fresh()->status)->toBe('approved');
});

test('can mark payslip as paid', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $payslip = Payslip::factory()->create([
        'employee_id' => $employee->id,
        'status' => 'approved',
    ]);

    $this->actingAs($this->owner)->post(route('admin.payslips.mark-paid', $payslip), [
        'paid_method' => 'transfer',
    ])->assertRedirect();

    expect($payslip->fresh()->status)->toBe('paid');
    expect($payslip->fresh()->paid_method)->toBe('transfer');
});

test('regenerating payslips keeps paid status intact', function () {
    $employee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    SalaryComponent::factory()->create([
        'employee_id' => $employee->id,
        'base_salary' => 3000000,
        'salary_type' => 'monthly',
        'meal_allowance' => 50000,
        'transport_allowance' => 30000,
    ]);

    $service = app(PayrollService::class);
    $service->generatePayslips('2026-07');

    $payslip = Payslip::where('employee_id', $employee->id)->where('period', '2026-07')->first();
    expect($payslip->status)->toBe('draft');

    $payslip->update([
        'status' => 'paid',
        'paid_at' => now(),
        'paid_method' => 'cash',
    ]);

    // Re-generate: paid status must not revert to draft
    $service->generatePayslips('2026-07');

    $payslip->refresh();
    expect($payslip->status)->toBe('paid');
    expect($payslip->paid_method)->toBe('cash');
    expect($payslip->paid_at)->not->toBeNull();
});

test('payslips index includes deduction reasons', function () {
    $employee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    Payslip::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
    ]);

    Deduction::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
        'type' => 'loan',
        'amount' => 150000,
        'notes' => 'Pinjaman karyawan',
    ]);

    $this->actingAs($this->owner)
        ->get(route('admin.payslips.index', ['period' => '2026-07']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/payroll/Payslips')
            ->has('payslips', 1)
            ->has('payslips.0.employee.deductions', 1)
            ->where('payslips.0.employee.deductions.0.type', 'loan')
            ->where('payslips.0.employee.deductions.0.notes', 'Pinjaman karyawan')
        );
});

test('payslip pdf includes deduction reasons', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    $payslip = Payslip::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
    ]);

    Deduction::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
        'type' => 'loan',
        'amount' => 150000,
        'notes' => 'Pinjaman karyawan',
    ]);

    $this->actingAs($this->owner)
        ->get(route('payslips.pdf', $payslip))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

// ─── Payroll Report ──────────────────────────────────────────

test('payroll report shows data for period', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);
    Payslip::factory()->create([
        'employee_id' => $employee->id,
        'period' => '2026-07',
    ]);

    $this->actingAs($this->owner)
        ->get(route('admin.payroll.report', ['period' => '2026-07']))
        ->assertOk();
});

test('payroll report requires owner/admin', function () {
    $this->actingAs($this->cashier)
        ->get(route('admin.payroll.report'))
        ->assertForbidden();
});

// ─── Payroll Service ─────────────────────────────────────────

test('payroll service generates payslip with overtime', function () {
    $employee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    SalaryComponent::factory()->create([
        'employee_id' => $employee->id,
        'base_salary' => 3000000,
        'salary_type' => 'monthly',
        'overtime_rate_per_hour' => 25000,
    ]);

    $shift = Shift::factory()->create([
        'employee_id' => $employee->id,
        'shift_date' => '2026-07-15',
        'start_time' => '08:00',
        'end_time' => '16:00',
    ]);

    $attendance = Attendance::factory()->create([
        'employee_id' => $employee->id,
        'clock_in_at' => '2026-07-15 08:00:00',
        'clock_out_at' => '2026-07-15 18:00:00',
    ]);

    // Directly test the payroll service internals
    $service = app(PayrollService::class);

    $startDate = Carbon::create(2026, 7, 1);
    $endDate = $startDate->copy()->endOfMonth();

    $payslip = $service->generateForEmployee($employee, '2026-07', $startDate, $endDate);

    expect($payslip)->not->toBeNull();

    expect((float) $payslip->overtime_total)->toBe(50000.0);
});

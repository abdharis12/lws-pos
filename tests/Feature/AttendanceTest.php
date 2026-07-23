<?php

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Outlet;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);

    $this->outlet = Outlet::factory()->create([
        'latitude' => -2.989722,
        'longitude' => 104.756287,
        'geofence_radius_meters' => 200,
    ]);

    $this->owner = User::factory()->create()->assignRole('Owner');
    $this->employee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);
});

test('attendance index requires authentication', function () {
    $this->get(route('admin.attendance.index'))->assertRedirect(route('login'));
});

test('owner can view attendance index', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.attendance.index'))
        ->assertOk();
});

test('employee can clock in', function () {
    $this->travelTo(now()->setHours(8)->setMinutes(5)->setSeconds(0));

    $this->actingAs($this->owner)->post(route('admin.attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHas('success');

    $this->assertDatabaseHas('attendances', [
        'employee_id' => $this->employee->id,
    ]);
});

test('cannot clock in twice on same day', function () {
    Attendance::factory()->create([
        'employee_id' => $this->employee->id,
        'clock_in_at' => now(),
        'clock_out_at' => null,
    ]);

    $this->actingAs($this->owner)->post(route('admin.attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHasErrors(['employee_id']);
});

test('employee can clock out', function () {
    $attendance = Attendance::factory()->create([
        'employee_id' => $this->employee->id,
        'clock_in_at' => now()->subHours(5),
        'clock_out_at' => null,
    ]);

    $this->actingAs($this->owner)->post(route('admin.attendance.clock-out'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHas('success');

    $this->assertNotNull($attendance->fresh()->clock_out_at);
});

test('cannot clock out without clocking in', function () {
    $this->actingAs($this->owner)->post(route('admin.attendance.clock-out'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHasErrors();
});

test('attendance recap filters by month', function () {
    Attendance::factory()->create([
        'employee_id' => $this->employee->id,
        'clock_in_at' => now(),
    ]);

    $this->actingAs($this->owner)
        ->get(route('admin.attendance.recap', ['month' => now()->format('Y-m')]))
        ->assertOk();
});

test('owner can view attendance recap', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.attendance.recap'))
        ->assertOk();
});

test('marks late when clock in after schedule', function () {
    $this->employee->shifts()->create([
        'shift_date' => today()->format('Y-m-d'),
        'start_time' => '08:00',
        'end_time' => '16:00',
    ]);

    // Travel to after shift start + grace period
    $this->travelTo(now()->setHours(9)->setMinutes(0)->setSeconds(0));

    $this->actingAs($this->owner)->post(route('admin.attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ]);

    $this->assertDatabaseHas('attendances', [
        'employee_id' => $this->employee->id,
        'status' => 'late',
    ]);
});

test('inactive employee cannot clock in', function () {
    $this->employee->update(['is_active' => false]);

    $this->actingAs($this->owner)->post(route('admin.attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHasErrors(['employee_id']);
});

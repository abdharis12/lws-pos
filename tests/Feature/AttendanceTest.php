<?php

use App\Events\AttendanceUpdated;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
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

    $employeeUser = User::factory()->create();
    $this->owner = User::factory()->create()->assignRole('Owner');
    $this->employee = Employee::factory()->create([
        'user_id' => $employeeUser->id,
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    Carbon::setTestNow();
});

test('attendance index requires authentication', function () {
    $this->get(route('attendance.index'))->assertRedirect(route('login'));
});

test('owner can view attendance index', function () {
    $this->actingAs($this->owner)
        ->get(route('attendance.index'))
        ->assertOk();
});

test('employee can clock in', function () {
    $this->travelTo(now()->setHours(8)->setMinutes(5)->setSeconds(0));

    $this->actingAs($this->owner)->post(route('attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHas('inertia.flash_data');

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

    $this->actingAs($this->owner)->post(route('attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHasErrors(['employee_id']);
});

test('dispatches AttendanceUpdated event when clocking in', function () {
    Event::fake([AttendanceUpdated::class]);

    $this->travelTo(now()->setHours(8)->setMinutes(5)->setSeconds(0));

    $this->actingAs($this->owner)->post(route('attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ]);

    Event::assertDispatched(AttendanceUpdated::class);
});

test('dispatches AttendanceUpdated event when clocking out', function () {
    Event::fake([AttendanceUpdated::class]);

    Attendance::factory()->create([
        'employee_id' => $this->employee->id,
        'clock_in_at' => now()->subHours(5),
        'clock_out_at' => null,
    ]);

    $this->actingAs($this->owner)->post(route('attendance.clock-out'), [
        'employee_id' => $this->employee->id,
    ]);

    Event::assertDispatched(AttendanceUpdated::class);
});

test('employee can clock out', function () {
    $attendance = Attendance::factory()->create([
        'employee_id' => $this->employee->id,
        'clock_in_at' => now()->subHours(5),
        'clock_out_at' => null,
    ]);

    $this->actingAs($this->owner)->post(route('attendance.clock-out'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHas('inertia.flash_data');

    $this->assertNotNull($attendance->fresh()->clock_out_at);
});

test('cannot clock out without clocking in', function () {
    $this->actingAs($this->owner)->post(route('attendance.clock-out'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHasErrors();
});

test('attendance recap filters by month', function () {
    Attendance::factory()->create([
        'employee_id' => $this->employee->id,
        'clock_in_at' => now(),
    ]);

    $this->actingAs($this->owner)
        ->get(route('attendance.recap', ['month' => now()->format('Y-m')]))
        ->assertOk();
});

test('owner can view attendance recap', function () {
    $this->actingAs($this->owner)
        ->get(route('attendance.recap'))
        ->assertOk();
});

test('marks late when clock in after schedule', function () {
    $this->employee->shifts()->create([
        'shift_date' => today()->format('Y-m-d'),
        'start_time' => '08:00',
        'end_time' => '16:00',
    ]);

    $this->travelTo(now()->setHours(9)->setMinutes(0)->setSeconds(0));

    $this->actingAs($this->owner)->post(route('attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ]);

    $this->assertDatabaseHas('attendances', [
        'employee_id' => $this->employee->id,
        'status' => 'late',
    ]);
});

test('marks early leave when clock out before shift end', function () {
    $this->travelTo(Carbon::now()->setHours(14)->setMinutes(0)->setSeconds(0));

    $this->employee->shifts()->create([
        'shift_date' => today()->format('Y-m-d'),
        'start_time' => '08:00',
        'end_time' => '16:00',
    ]);

    $attendance = Attendance::factory()->create([
        'employee_id' => $this->employee->id,
        'clock_in_at' => now()->setHours(8)->setMinutes(0)->setSeconds(0),
        'clock_out_at' => null,
    ]);

    $this->actingAs($this->owner)->post(route('attendance.clock-out'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHas('inertia.flash_data');

    $this->assertTrue($attendance->fresh()->early_leave);
});

test('employee user can access own attendance', function () {
    $employeeUser = $this->employee->user;

    $this->actingAs($employeeUser)
        ->get(route('attendance.index'))
        ->assertOk();
});

test('employee user can clock in for self', function () {
    $employeeUser = $this->employee->user;

    $this->travelTo(now()->setHours(8)->setMinutes(5)->setSeconds(0));

    $this->actingAs($employeeUser)->post(route('attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHas('inertia.flash_data');
});

test('employee user cannot clock in for other employee', function () {
    $otherEmployee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    $employeeUser = $this->employee->user;

    $this->actingAs($employeeUser)->post(route('attendance.clock-in'), [
        'employee_id' => $otherEmployee->id,
    ])->assertForbidden();
});

test('employee user cannot access admin pages', function () {
    $employeeUser = $this->employee->user;

    $this->actingAs($employeeUser)
        ->get(route('admin.employees.index'))
        ->assertForbidden();
});

test('does not mark early leave when clock out after shift end', function () {
    $this->travelTo(Carbon::now()->setHours(17)->setMinutes(0)->setSeconds(0));

    $this->employee->shifts()->create([
        'shift_date' => today()->format('Y-m-d'),
        'start_time' => '08:00',
        'end_time' => '16:00',
    ]);

    $attendance = Attendance::factory()->create([
        'employee_id' => $this->employee->id,
        'clock_in_at' => now()->setHours(8)->setMinutes(0)->setSeconds(0),
        'clock_out_at' => null,
    ]);

    $this->actingAs($this->owner)->post(route('attendance.clock-out'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHas('inertia.flash_data');

    $this->assertFalse($attendance->fresh()->early_leave);
});

test('inactive employee cannot clock in', function () {
    $this->employee->update(['is_active' => false]);

    $this->actingAs($this->owner)->post(route('attendance.clock-in'), [
        'employee_id' => $this->employee->id,
    ])->assertSessionHasErrors(['employee_id']);
});

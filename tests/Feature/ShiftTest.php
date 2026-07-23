<?php

use App\Models\Employee;
use App\Models\Outlet;
use App\Models\Shift;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);

    $this->outlet = Outlet::factory()->create();
    $this->owner = User::factory()->create()->assignRole('Owner');
    $this->employee = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);
});

test('shift index requires authentication', function () {
    $this->get(route('admin.shifts.index'))->assertRedirect(route('login'));
});

test('owner can view shift index', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.shifts.index'))
        ->assertOk();
});

test('owner can create shift', function () {
    $this->actingAs($this->owner)->post(route('admin.shifts.store'), [
        'employee_id' => $this->employee->id,
        'shift_date' => today()->format('Y-m-d'),
        'start_time' => '08:00',
        'end_time' => '16:00',
    ])->assertSessionHas('success');

    $this->assertDatabaseHas('shifts', [
        'employee_id' => $this->employee->id,
        'start_time' => '08:00',
        'end_time' => '16:00',
    ]);
});

test('cannot create duplicate shift for same employee and date', function () {
    $shiftDate = today()->format('Y-m-d');
    Shift::create([
        'employee_id' => $this->employee->id,
        'shift_date' => $shiftDate,
        'start_time' => '08:00',
        'end_time' => '14:00',
    ]);

    $this->actingAs($this->owner)->post(route('admin.shifts.store'), [
        'employee_id' => $this->employee->id,
        'shift_date' => $shiftDate,
        'start_time' => '09:00',
        'end_time' => '17:00',
    ]);

    expect(Shift::where('employee_id', $this->employee->id)->count())->toBe(1);
});

test('owner can update shift', function () {
    $shift = Shift::factory()->create([
        'employee_id' => $this->employee->id,
    ]);

    $this->actingAs($this->owner)->put(route('admin.shifts.update', $shift), [
        'start_time' => '09:00',
        'end_time' => '17:00',
    ])->assertSessionHas('success');

    expect($shift->fresh())
        ->start_time->toEqual('09:00')
        ->end_time->toEqual('17:00');
});

test('owner can delete shift', function () {
    $shift = Shift::factory()->create([
        'employee_id' => $this->employee->id,
    ]);

    $this->actingAs($this->owner)
        ->delete(route('admin.shifts.destroy', $shift))
        ->assertSessionHas('success');

    $this->assertModelMissing($shift);
});

test('bulk store shifts', function () {
    $employee2 = Employee::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => true,
    ]);

    $this->actingAs($this->owner)->post(route('admin.shifts.bulk-store'), [
        'shifts' => [
            [
                'employee_id' => $this->employee->id,
                'shift_date' => today()->format('Y-m-d'),
                'start_time' => '08:00',
                'end_time' => '16:00',
            ],
            [
                'employee_id' => $employee2->id,
                'shift_date' => today()->format('Y-m-d'),
                'start_time' => '14:00',
                'end_time' => '22:00',
            ],
        ],
    ])->assertSessionHas('success');

    $this->assertDatabaseCount('shifts', 2);
});

test('shift start time must be before end time', function () {
    $this->actingAs($this->owner)->post(route('admin.shifts.store'), [
        'employee_id' => $this->employee->id,
        'shift_date' => today()->format('Y-m-d'),
        'start_time' => '16:00',
        'end_time' => '08:00',
    ])->assertSessionHasErrors(['end_time']);
});

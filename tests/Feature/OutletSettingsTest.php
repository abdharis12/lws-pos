<?php

use App\Models\Employee;
use App\Models\Outlet;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);

    $this->outlet = Outlet::factory()->create();

    $this->owner = User::factory()->create()->assignRole('Owner');
    Employee::factory()->create([
        'user_id' => $this->owner->id,
        'outlet_id' => $this->outlet->id,
    ]);
});

test('owner can update outlet settings', function () {
    $this->actingAs($this->owner)
        ->put(route('admin.outlet.update'), [
            'name' => 'Outlet Baru',
            'latitude' => -2.9761,
            'longitude' => 104.7754,
            'geofence_radius_meters' => 50,
        ])
        ->assertRedirect(route('admin.outlet.edit'));

    expect($this->outlet->fresh()->name)->toBe('Outlet Baru');
    expect((float) $this->outlet->fresh()->latitude)->toBe(-2.9761);
    expect((float) $this->outlet->fresh()->longitude)->toBe(104.7754);
    expect($this->outlet->fresh()->geofence_radius_meters)->toBe(50);
});

test('owner can view outlet settings page', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.outlet.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/outlets/Settings'));
});

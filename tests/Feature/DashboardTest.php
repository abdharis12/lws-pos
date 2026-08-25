<?php

use App\Models\Employee;
use App\Models\Outlet;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $outlet = Outlet::factory()->create();
    $user = User::factory()->create();
    Employee::factory()->create(['user_id' => $user->id, 'outlet_id' => $outlet->id]);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

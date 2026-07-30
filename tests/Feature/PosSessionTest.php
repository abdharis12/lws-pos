<?php

use App\Models\Outlet;
use App\Models\PosSession;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);

    $this->outlet = Outlet::factory()->create();
});

it('allows owner to open a session', function () {
    $user = User::factory()->create()->assignRole('Owner');

    $response = $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $response->assertCreated();
    expect((float) $response['opening_balance'])->toBe(500000.0);
    expect($response['status'])->toBe('open');
});

it('prevents cashier from opening a session', function () {
    $user = User::factory()->create()->assignRole('Cashier');

    $response = $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $response->assertForbidden();
});

it('prevents duplicate open session', function () {
    $user = User::factory()->create()->assignRole('Owner');

    $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $response = $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 300000,
    ]);

    $response->assertStatus(409);
});

it('allows owner to close a session', function () {
    $user = User::factory()->create()->assignRole('Owner');

    $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $session = PosSession::first();

    $response = $this->actingAs($user)->postJson("/pos/sessions/{$session->id}/close");

    $response->assertSuccessful();
    expect($response['status'])->toBe('closed');
});

it('prevents cashier from closing a session', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $cashier = User::factory()->create()->assignRole('Cashier');

    $this->actingAs($owner)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $session = PosSession::first();

    $response = $this->actingAs($cashier)->postJson("/pos/sessions/{$session->id}/close");

    $response->assertForbidden();
});

it('can show session details', function () {
    $user = User::factory()->create()->assignRole('Owner');

    $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $session = PosSession::first();

    $response = $this->actingAs($user)->getJson("/pos/sessions/{$session->id}");

    $response->assertSuccessful();
    expect($response['session']['id'])->toBe($session->id);
});

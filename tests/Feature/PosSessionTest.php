<?php

use App\Models\Employee;
use App\Models\Meja;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Payment;
use App\Models\PosSession;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);

    $this->outlet = Outlet::factory()->create();
});

it('allows owner to open a session', function () {
    $user = User::factory()->create()->assignRole('Owner');
    Employee::factory()->create(['user_id' => $user->id, 'outlet_id' => $this->outlet->id]);

    $response = $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $response->assertCreated();
    expect((float) $response->json('opening_balance'))->toBe(500000.0);
    expect($response->json('status'))->toBe('open');
});

it('prevents cashier from opening a session', function () {
    $user = User::factory()->create()->assignRole('Cashier');
    Employee::factory()->create(['user_id' => $user->id, 'outlet_id' => $this->outlet->id]);

    $response = $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $response->assertForbidden();
});

it('prevents duplicate open session', function () {
    $user = User::factory()->create()->assignRole('Owner');
    Employee::factory()->create(['user_id' => $user->id, 'outlet_id' => $this->outlet->id]);

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
    Employee::factory()->create(['user_id' => $user->id, 'outlet_id' => $this->outlet->id]);

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
    Employee::factory()->create(['user_id' => $owner->id, 'outlet_id' => $this->outlet->id]);
    $cashier = User::factory()->create()->assignRole('Cashier');
    Employee::factory()->create(['user_id' => $cashier->id, 'outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $session = PosSession::first();

    $response = $this->actingAs($cashier)->postJson("/pos/sessions/{$session->id}/close");

    $response->assertForbidden();
});

it('can show session details', function () {
    $user = User::factory()->create()->assignRole('Owner');
    Employee::factory()->create(['user_id' => $user->id, 'outlet_id' => $this->outlet->id]);

    $this->actingAs($user)->postJson('/pos/sessions', [
        'opening_balance' => 500000,
    ]);

    $session = PosSession::first();

    $response = $this->actingAs($user)->getJson("/pos/sessions/{$session->id}");

    $response->assertSuccessful();
    expect($response['session']['id'])->toBe($session->id);
});

it('session index does not trigger N+1 on orders payment', function () {
    $user = User::factory()->create()->assignRole('Owner');
    $session = PosSession::create([
        'outlet_id' => $this->outlet->id,
        'session_date' => today(),
        'opening_balance' => 0,
        'status' => 'open',
        'opened_by' => $user->id,
        'opened_at' => now(),
    ]);

    $table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);
    $tableSession = TableSession::factory()->create([
        'table_id' => $table->id,
        'status' => 'active',
    ]);

    $orders = Order::factory()->count(5)->create([
        'table_session_id' => $tableSession->id,
        'pos_session_id' => $session->id,
        'status' => 'paid',
        'created_at' => now(),
    ]);

    foreach ($orders as $order) {
        Payment::factory()->create([
            'order_id' => $order->id,
            'method' => 'cash',
            'gross_amount' => $order->total,
            'status' => 'settlement',
        ]);
    }

    DB::enableQueryLog();

    $response = $this->actingAs($user)->get('/pos/sessions');
    $response->assertSuccessful();

    $queries = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($queries)->toBeLessThan(20);
});

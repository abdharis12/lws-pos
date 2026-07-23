<?php

use App\Models\Meja;
use App\Models\Outlet;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);
    Role::firstOrCreate(['name' => 'Waiter']);

    $this->outlet = Outlet::factory()->create();
});

test('table list requires authentication', function () {
    $this->get(route('admin.tables.index'))->assertRedirect(route('login'));
});

test('owner can view tables', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    Meja::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)
        ->get(route('admin.tables.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/tables/Index'));
});

test('owner can create table', function () {
    $owner = User::factory()->create()->assignRole('Owner');

    $this->actingAs($owner)->post(route('admin.tables.store'), [
        'code' => 'VIP1',
        'capacity' => 6,
    ])->assertRedirect();

    $this->assertDatabaseHas('tables', [
        'code' => 'VIP1',
        'outlet_id' => $this->outlet->id,
        'status' => 'available',
    ]);

    $table = Meja::where('code', 'VIP1')->first();
    expect($table->table_token)->not->toBeNull();
    expect(strlen($table->table_token))->toBe(40);
});

test('owner can update table', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $table = Meja::factory()->create(['outlet_id' => $this->outlet->id, 'status' => 'available']);

    $this->actingAs($owner)->put(route('admin.tables.update', $table), [
        'code' => 'VIP1',
        'capacity' => 8,
        'status' => 'occupied',
    ])->assertRedirect();

    expect($table->fresh()->capacity)->toBe(8);
    expect($table->fresh()->status)->toBe('occupied');
});

test('owner can delete table', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($owner)
        ->delete(route('admin.tables.destroy', $table))
        ->assertRedirect();

    $this->assertDatabaseMissing('tables', ['id' => $table->id]);
});

test('admin cannot delete table', function () {
    $admin = User::factory()->create()->assignRole('Admin');
    $table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($admin)
        ->delete(route('admin.tables.destroy', $table))
        ->assertForbidden();
});

test('owner can regenerate table token', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    $originalToken = str_repeat('a', 40);
    $table = Meja::factory()->create([
        'outlet_id' => $this->outlet->id,
        'table_token' => $originalToken,
    ]);

    $this->actingAs($owner)
        ->post(route('admin.tables.regenerate-token', $table))
        ->assertRedirect();

    expect($table->fresh()->table_token)->not->toBe($originalToken);
    expect(strlen($table->fresh()->table_token))->toBe(40);
});

test('admin can regenerate table token', function () {
    $admin = User::factory()->create()->assignRole('Admin');
    $table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($admin)
        ->post(route('admin.tables.regenerate-token', $table))
        ->assertRedirect();
});

test('waiter cannot create table', function () {
    $waiter = User::factory()->create()->assignRole('Waiter');

    $this->actingAs($waiter)
        ->post(route('admin.tables.store'), ['code' => 'T99', 'capacity' => 4])
        ->assertForbidden();
});

test('table capacity validation', function () {
    $owner = User::factory()->create()->assignRole('Owner');

    $this->actingAs($owner)
        ->post(route('admin.tables.store'), ['code' => 'T99', 'capacity' => 0])
        ->assertSessionHasErrors('capacity');

    $this->actingAs($owner)
        ->post(route('admin.tables.store'), ['code' => 'T99', 'capacity' => 21])
        ->assertSessionHasErrors('capacity');
});

test('table code validation requires unique code', function () {
    $owner = User::factory()->create()->assignRole('Owner');
    Meja::factory()->create(['outlet_id' => $this->outlet->id, 'code' => 'T01']);

    $this->actingAs($owner)
        ->post(route('admin.tables.store'), ['code' => 'T01', 'capacity' => 4])
        ->assertSessionHasErrors('code');
});

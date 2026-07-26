<?php

use App\Models\ActivityLog;
use App\Models\Employee;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);

    $this->outlet = Outlet::factory()->create();
    $this->owner = User::factory()->create()->assignRole('Owner');
    $this->admin = User::factory()->create()->assignRole('Admin');
    $this->cashier = User::factory()->create()->assignRole('Cashier');
});

// ─── Activity Log Viewing ────────────────────────────────────

test('activity logs list requires owner/admin', function () {
    $this->actingAs($this->cashier)->get(route('admin.activity-logs.index'))->assertForbidden();
    $this->actingAs($this->owner)->get(route('admin.activity-logs.index'))->assertOk();
    $this->actingAs($this->admin)->get(route('admin.activity-logs.index'))->assertOk();
});

test('activity logs can be filtered by action', function () {
    ActivityLog::factory()->create(['action' => 'employee_deleted', 'user_id' => $this->owner->id]);
    ActivityLog::factory()->create(['action' => 'menu.created', 'user_id' => $this->owner->id]);

    $response = $this->actingAs($this->owner)
        ->get(route('admin.activity-logs.index', ['action' => 'employee_deleted']))
        ->assertOk();

    expect($response->content())->toContain('employee_deleted');
});

// ─── Log Creation ────────────────────────────────────────────

test('menu creation creates activity log', function () {
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($this->owner)->post(route('admin.menus.store'), [
        'category_id' => $category->id,
        'name' => 'Bubur Ayam Spesial',
        'price' => 25000,
        'description' => 'Enak sekali',
    ])->assertRedirect();

    $this->assertDatabaseHas('activity_logs', [
        'action' => 'menu.created',
        'subject_type' => Menu::class,
    ]);
});

test('menu deletion creates activity log', function () {
    $category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id]);
    $menu = Menu::factory()->create(['category_id' => $category->id]);

    $this->actingAs($this->owner)->delete(route('admin.menus.destroy', $menu))
        ->assertRedirect();

    $this->assertDatabaseHas('activity_logs', [
        'action' => 'menu.deleted',
        'subject_type' => Menu::class,
    ]);
});

test('employee deletion creates activity log', function () {
    $employee = Employee::factory()->create(['outlet_id' => $this->outlet->id]);

    $this->actingAs($this->owner)->delete(route('admin.employees.destroy', $employee))
        ->assertRedirect();

    $this->assertDatabaseHas('activity_logs', [
        'action' => 'employee_deleted',
    ]);
});

test('order cancellation creates activity log', function () {
    $order = Order::factory()->create();

    $this->actingAs($this->owner)->patch(route('orders.update-status', $order), [
        'status' => 'cancelled',
    ])->assertRedirect();

    $this->assertDatabaseHas('activity_logs', [
        'action' => 'order.cancelled',
        'subject_type' => Order::class,
    ]);
});

// ─── Audit Log Access Control ────────────────────────────────

test('cashier cannot view activity logs', function () {
    ActivityLog::factory()->count(3)->create();

    $this->actingAs($this->cashier)
        ->get(route('admin.activity-logs.index'))
        ->assertForbidden();
});

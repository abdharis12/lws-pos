<?php

use App\Models\Meja;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\Payment;
use App\Models\TableSession;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);

    $this->outlet = Outlet::factory()->create();
    $this->owner = User::factory()->create()->assignRole('Owner');
    $this->table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);
    $this->session = TableSession::factory()->create(['table_id' => $this->table->id]);
});

test('sales report index requires authentication', function () {
    $this->get(route('admin.reports.index'))->assertRedirect(route('login'));
});

test('owner can view sales report', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.reports.index'))
        ->assertOk();
});

test('owner can view sales report with daily period', function () {
    Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'total' => 50000,
        'created_at' => now(),
    ]);

    $this->actingAs($this->owner)
        ->get(route('admin.reports.index', ['period' => 'daily', 'date' => today()->format('Y-m-d')]))
        ->assertOk();
});

test('owner can view top menus report', function () {
    $menu = Menu::factory()->create();
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'total' => 25000,
    ]);
    OrderItem::factory()->create([
        'order_id' => $order->id,
        'menu_id' => $menu->id,
        'qty' => 2,
        'total_price' => 25000,
    ]);

    $this->actingAs($this->owner)
        ->get(route('admin.reports.top-menus'))
        ->assertOk();
});

test('owner can view reconciliation report', function () {
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'total' => 50000,
    ]);
    Payment::factory()->create([
        'order_id' => $order->id,
        'method' => 'qris',
        'gross_amount' => 50000,
        'status' => 'settlement',
    ]);

    $this->actingAs($this->owner)
        ->get(route('admin.reports.reconciliation'))
        ->assertOk();
});

test('owner can view attendance report', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.reports.attendance'))
        ->assertOk();
});

test('owner can view overtime report', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.reports.overtime'))
        ->assertOk();
});

test('owner can export sales report', function () {
    $this->actingAs($this->owner)
        ->get(route('admin.reports.export', ['format' => 'xlsx']))
        ->assertOk();
});

test('owner dashboard requires authentication', function () {
    $this->get(route('owner.dashboard'))->assertRedirect(route('login'));
});

test('owner can view owner dashboard', function () {
    $this->actingAs($this->owner)
        ->get(route('owner.dashboard'))
        ->assertOk();
});

test('owner dashboard shows sales data', function () {
    Order::factory()->count(3)->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'total' => 50000,
        'created_at' => now(),
    ]);

    $response = $this->actingAs($this->owner)
        ->get(route('owner.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('todayOrdersCount', 3)
    );
});

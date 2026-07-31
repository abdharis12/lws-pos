<?php

use App\Enums\OrderStatus;
use App\Models\Employee;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\TableSession;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);
    Role::firstOrCreate(['name' => 'Kitchen Staff']);
    Role::firstOrCreate(['name' => 'Waiter']);

    $this->outlet = Outlet::factory()->create();
    $this->category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id, 'is_active' => true]);

    $this->mainStationMenu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Bubur Ayam',
        'price' => 25000,
        'station' => 'Main',
        'is_available' => true,
    ]);

    $this->grillStationMenu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Sate Ayam',
        'price' => 30000,
        'station' => 'Grill',
        'is_available' => true,
    ]);

    $this->noStationMenu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Es Teh',
        'price' => 5000,
        'station' => null,
        'is_available' => true,
    ]);

    $this->table = Meja::factory()->create([
        'outlet_id' => $this->outlet->id,
        'status' => 'available',
    ]);

    $this->session = TableSession::factory()->create([
        'table_id' => $this->table->id,
        'status' => 'active',
    ]);

    $this->kitchenStaff = User::factory()->create()->assignRole('Kitchen Staff');
    Employee::factory()->create([
        'user_id' => $this->kitchenStaff->id,
        'outlet_id' => $this->outlet->id,
    ]);

    $this->cashier = User::factory()->create()->assignRole('Cashier');
});

// ─── Page Access ─────────────────────────────────────────────

test('kitchen staff can view KDS page', function () {
    $this->actingAs($this->kitchenStaff)
        ->get(route('kitchen.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('kitchen/Index'));
});

test('KDS page requires authentication', function () {
    $this->get(route('kitchen.index'))->assertRedirect(route('login'));
});

test('cashier can view KDS page', function () {
    $this->actingAs($this->cashier)
        ->get(route('kitchen.index'))
        ->assertOk();
});

// ─── Order Visibility ────────────────────────────────────────

test('KDS shows only paid and processing orders', function () {
    Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'order_type' => 'cashier',
        'subtotal' => 25000,
        'total' => 25000,
    ]);

    Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'processing',
        'order_type' => 'cashier',
        'subtotal' => 30000,
        'total' => 30000,
    ]);

    Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'pending_payment',
        'order_type' => 'cashier',
        'subtotal' => 5000,
        'total' => 5000,
    ]);

    Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'completed',
        'order_type' => 'cashier',
        'subtotal' => 25000,
        'total' => 25000,
    ]);

    $this->actingAs($this->kitchenStaff)
        ->get(route('kitchen.index'))
        ->assertInertia(fn ($page) => $page
            ->component('kitchen/Index')
        );
});

test('KDS shows orders grouped by station', function () {
    $order1 = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
    ]);
    $order1->items()->create([
        'menu_id' => $this->mainStationMenu->id,
        'qty' => 2,
        'base_price' => 25000,
        'total_price' => 50000,
    ]);

    $order2 = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
    ]);
    $order2->items()->create([
        'menu_id' => $this->grillStationMenu->id,
        'qty' => 1,
        'base_price' => 30000,
        'total_price' => 30000,
    ]);

    $response = $this->actingAs($this->kitchenStaff)
        ->get(route('kitchen.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('kitchen/Index')
        ->has('stations', 2)
        ->has('stations.0', fn ($s) => $s
            ->where('name', 'Grill')
            ->has('orders', 1)
        )
        ->has('stations.1', fn ($s) => $s
            ->where('name', 'Main')
            ->has('orders', 1)
        )
    );
});

test('KDS shows unassigned orders without station', function () {
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
    ]);
    $order->items()->create([
        'menu_id' => $this->noStationMenu->id,
        'qty' => 1,
        'base_price' => 5000,
        'total_price' => 5000,
    ]);

    $this->actingAs($this->kitchenStaff)
        ->get(route('kitchen.index'))
        ->assertInertia(fn ($page) => $page
            ->component('kitchen/Index')
            ->has('stations', 0)
            ->has('unassignedOrders', 1)
        );
});

test('KDS shows ready orders in dedicated readyOrders prop', function () {
    $ready = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'ready',
    ]);
    $ready->items()->create([
        'menu_id' => $this->mainStationMenu->id,
        'qty' => 2,
        'base_price' => 25000,
        'total_price' => 50000,
    ]);

    $this->actingAs($this->kitchenStaff)
        ->get(route('kitchen.index'))
        ->assertInertia(fn ($page) => $page
            ->component('kitchen/Index')
            ->has('readyOrders', 1)
            ->where('readyOrders.0.id', $ready->id)
            ->has('stations', 0)
        );
});

// ─── Status Updates ──────────────────────────────────────────

test('kitchen staff can mark order as processing', function () {
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
    ]);
    $order->items()->create([
        'menu_id' => $this->mainStationMenu->id,
        'qty' => 1,
        'base_price' => 25000,
        'total_price' => 25000,
    ]);

    $this->actingAs($this->kitchenStaff)
        ->patch(route('orders.update-status', $order), [
            'status' => 'processing',
        ])
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Processing);
});

test('kitchen staff can mark order as ready', function () {
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'processing',
    ]);
    $order->items()->create([
        'menu_id' => $this->mainStationMenu->id,
        'qty' => 1,
        'base_price' => 25000,
        'total_price' => 25000,
    ]);

    $this->actingAs($this->kitchenStaff)
        ->patch(route('orders.update-status', $order), [
            'status' => 'ready',
        ])
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Ready);
});

test('order status update validates status', function () {
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
    ]);

    $this->actingAs($this->kitchenStaff)
        ->patch(route('orders.update-status', $order), [
            'status' => 'invalid-status',
        ])
        ->assertSessionHasErrors('status');
});

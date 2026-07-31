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
    $this->menu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Bubur Ayam',
        'price' => 25000,
        'station' => 'Main',
        'is_available' => true,
    ]);

    $this->table = Meja::factory()->create([
        'outlet_id' => $this->outlet->id,
        'code' => 'T01',
        'status' => 'occupied',
    ]);

    $this->session = TableSession::factory()->create([
        'table_id' => $this->table->id,
        'status' => 'active',
    ]);

    $this->waiter = User::factory()->create()->assignRole('Waiter');
    Employee::factory()->create([
        'user_id' => $this->waiter->id,
        'outlet_id' => $this->outlet->id,
        'position' => 'waiter',
    ]);

    $this->plainUser = User::factory()->create();
});

function createReadyOrder(Outlet $outlet, TableSession $session, Menu $menu, string $status = 'ready'): Order
{
    $order = Order::factory()->create([
        'table_session_id' => $session->id,
        'order_type' => 'dine_in',
        'status' => $status,
    ]);
    $order->items()->create([
        'menu_id' => $menu->id,
        'qty' => 2,
        'base_price' => $menu->price,
        'total_price' => $menu->price * 2,
    ]);

    return $order;
}

// ─── Page Access ─────────────────────────────────────────────

test('waiter ready page requires authentication', function () {
    $this->get(route('waiter.ready'))->assertRedirect(route('login'));
});

test('waiter can view ready orders page', function () {
    $this->actingAs($this->waiter)
        ->get(route('waiter.ready'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('waiter/ReadyOrders'));
});

test('waiter ready page is forbidden for users without employee record', function () {
    $this->actingAs($this->plainUser)
        ->get(route('waiter.ready'))
        ->assertForbidden();
});

// ─── Ready Orders ────────────────────────────────────────────

test('waiter ready page lists only ready orders with table info', function () {
    $ready = createReadyOrder($this->outlet, $this->session, $this->menu, 'ready');
    $processing = createReadyOrder($this->outlet, $this->session, $this->menu, 'processing');
    $completed = createReadyOrder($this->outlet, $this->session, $this->menu, 'completed');

    $this->actingAs($this->waiter)
        ->get(route('waiter.ready'))
        ->assertInertia(fn ($page) => $page
            ->component('waiter/ReadyOrders')
            ->has('readyOrders', 1)
            ->where('readyOrders.0.id', $ready->id)
            ->where('readyOrders.0.table_session.table.code', 'T01')
            ->has('readyOrders.0.items', 1)
        );

    expect($processing->fresh()->status)->toBe(OrderStatus::Processing);
    expect($completed->fresh()->status)->toBe(OrderStatus::Completed);
});

// ─── Serve ───────────────────────────────────────────────────

test('waiter can serve a ready order', function () {
    $order = createReadyOrder($this->outlet, $this->session, $this->menu, 'ready');

    $this->actingAs($this->waiter)
        ->patch(route('orders.serve', $order))
        ->assertRedirect();

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Completed);
    expect($order->served_by)->toBe($this->waiter->id);
    expect($order->served_at)->not->toBeNull();
});

test('serve is forbidden for users without permission', function () {
    $order = createReadyOrder($this->outlet, $this->session, $this->menu, 'ready');

    $this->actingAs($this->plainUser)
        ->patch(route('orders.serve', $order))
        ->assertForbidden();
});

test('serve rejects orders that are not ready', function () {
    $order = createReadyOrder($this->outlet, $this->session, $this->menu, 'processing');

    $this->actingAs($this->waiter)
        ->patch(route('orders.serve', $order))
        ->assertStatus(422);

    expect($order->fresh()->status)->toBe(OrderStatus::Processing);
    expect($order->fresh()->served_by)->toBeNull();
});

// ─── Leaderboard ─────────────────────────────────────────────

test('waiter ready page shows today leaderboard with served points', function () {
    $order = createReadyOrder($this->outlet, $this->session, $this->menu, 'ready');
    $order->update([
        'status' => OrderStatus::Completed,
        'served_by' => $this->waiter->id,
        'served_at' => now(),
    ]);

    $this->actingAs($this->waiter)
        ->get(route('waiter.ready'))
        ->assertInertia(fn ($page) => $page
            ->component('waiter/ReadyOrders')
            ->has('leaderboard', 1)
            ->where('leaderboard.0.waiter', $this->waiter->name)
            ->where('leaderboard.0.points', 1)
        );
});

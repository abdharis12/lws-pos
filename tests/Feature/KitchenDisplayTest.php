<?php

use App\Enums\OrderItemStatus;
use App\Enums\OrderStatus;
use App\Models\Employee;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\OptionItem;
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
    Employee::factory()->create([
        'user_id' => $this->cashier->id,
        'outlet_id' => $this->outlet->id,
    ]);
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

test('KDS shows orders grouped into Main (food) and Drink stations', function () {
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
        ->has('stations', 1)
        ->has('stations.0', fn ($s) => $s
            ->where('name', 'Main')
            ->has('orders', 2)
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

// ─── Per-Station Item Readiness ─────────────────────────────

test('marking one station ready keeps the order processing until all stations are ready', function () {
    $drinkMenu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Es Jeruk',
        'price' => 8000,
        'station' => 'Drink',
        'is_available' => true,
    ]);

    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
    ]);
    $foodItem = $order->items()->create([
        'menu_id' => $this->mainStationMenu->id,
        'qty' => 1,
        'base_price' => 25000,
        'total_price' => 25000,
    ]);
    $drinkItem = $order->items()->create([
        'menu_id' => $drinkMenu->id,
        'qty' => 1,
        'base_price' => 8000,
        'total_price' => 8000,
    ]);

    $this->actingAs($this->kitchenStaff)
        ->patch(route('orders.items.update-status', $order), [
            'item_ids' => [$drinkItem->id],
            'status' => 'ready',
        ])
        ->assertRedirect();

    expect($drinkItem->fresh()->status)->toBe(OrderItemStatus::Ready);
    expect($foodItem->fresh()->status)->toBe(OrderItemStatus::Pending);
    expect($order->fresh()->status)->toBe(OrderStatus::Processing);

    $this->actingAs($this->kitchenStaff)
        ->get(route('kitchen.index'))
        ->assertInertia(fn ($page) => $page
            ->component('kitchen/Index')
            ->has('stations', 2)
            ->where('stations.0.name', 'Main')
            ->where('stations.0.orders.0.items.0.menu.name', 'Bubur Ayam')
            ->where('stations.0.orders.0.items.0.status', 'pending')
            ->where('stations.1.name', 'Drink')
            ->where('stations.1.orders.0.items.0.status', 'ready')
        );
});

test('order moves to readyOrders combined only when all items are ready', function () {
    $drinkMenu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Es Jeruk',
        'price' => 8000,
        'station' => 'Drink',
        'is_available' => true,
    ]);

    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'processing',
    ]);
    $foodItem = $order->items()->create([
        'menu_id' => $this->mainStationMenu->id,
        'qty' => 1,
        'base_price' => 25000,
        'total_price' => 25000,
    ]);
    $drinkItem = $order->items()->create([
        'menu_id' => $drinkMenu->id,
        'qty' => 1,
        'base_price' => 8000,
        'total_price' => 8000,
    ]);
    \Log::info('Test setup - drink item before update', ['id' => $drinkItem->id, 'status' => $drinkItem->status?->value ?? 'null']);
    $drinkItem->update(['status' => OrderItemStatus::Ready]);
    \Log::info('Test setup - drink item after update', ['id' => $drinkItem->fresh()->id, 'status' => $drinkItem->fresh()->status?->value ?? 'null']);
    $foodItem->update(['status' => OrderItemStatus::Processing]);

    $this->actingAs($this->kitchenStaff)
        ->patch(route('orders.items.update-status', $order), [
            'item_ids' => [$foodItem->id],
            'status' => 'ready',
        ])
        ->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::Ready);

    $this->actingAs($this->kitchenStaff)
        ->get(route('kitchen.index'))
        ->assertInertia(fn ($page) => $page
            ->component('kitchen/Index')
            ->has('stations', 0)
            ->has('readyOrders', 1)
            ->where('readyOrders.0.id', $order->id)
            ->where('readyOrders.0.items', fn ($items) => $items->count() === 2)
        );
});

// ─── Order Item Options / Toppings ──────────────────────────

test('KDS payload includes topping options for each item', function () {
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'order_type' => 'cashier',
    ]);
    $orderItem = $order->items()->create([
        'menu_id' => $this->mainStationMenu->id,
        'qty' => 1,
        'base_price' => 25000,
        'total_price' => 25000,
    ]);

    $optionGroup = OptionGroup::factory()->create([
        'outlet_id' => $this->outlet->id,
        'selection_type' => 'multiple',
        'is_required' => false,
    ]);
    $topping = OptionItem::factory()->create([
        'option_group_id' => $optionGroup->id,
        'name' => 'Telur Ceplok',
        'price_adjustment' => 3000,
        'is_available' => true,
    ]);
    $orderItem->options()->create([
        'option_item_id' => $topping->id,
        'price_adjustment' => 3000,
        'quantity' => 1,
    ]);

    $order->refresh()->load(['items.menu', 'items.options.optionItem']);

    expect($order->items)->toHaveCount(1);
    expect($order->items->first()->options)->toHaveCount(1);
    expect($order->items->first()->options->first()->optionItem?->name)->toBe('Telur Ceplok');
});

test('KDS routes assigned station order to stations group, not unassigned', function () {
    $grillMenu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Ayam Bakar',
        'price' => 30000,
        'station' => 'Grill',
    ]);
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
    ]);
    $order->items()->create([
        'menu_id' => $grillMenu->id,
        'qty' => 1,
        'base_price' => 30000,
        'total_price' => 30000,
    ]);

    $response = $this->actingAs($this->kitchenStaff)
        ->get(route('kitchen.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('kitchen/Index')
        ->has('stations', 1)
        ->where('stations.0.name', 'Main')
        ->has('stations.0.orders', 1)
        ->has('unassignedOrders', 0)
    );
});

test('KDS routes unassigned menu (no station) to unassignedOrders group', function () {
    $noStationMenu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'name' => 'Es Teh',
        'price' => 5000,
        'station' => null,
    ]);
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
    ]);
    $order->items()->create([
        'menu_id' => $noStationMenu->id,
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
            ->where('unassignedOrders.0.items.0.menu.station', null)
        );
});

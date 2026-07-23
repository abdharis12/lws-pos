<?php

use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\OptionItem;
use App\Models\OrderItem;
use App\Models\Outlet;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->outlet = Outlet::factory()->create();
    $this->category = MenuCategory::factory()->create(['outlet_id' => $this->outlet->id, 'is_active' => true]);
    $this->menu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'price' => 25000,
        'is_available' => true,
    ]);
    $this->optionGroup = OptionGroup::factory()->create([
        'outlet_id' => $this->outlet->id,
        'selection_type' => 'single',
        'is_required' => true,
        'min_select' => 1,
        'max_select' => 1,
    ]);
    $this->optionItem = OptionItem::factory()->create([
        'option_group_id' => $this->optionGroup->id,
        'price_adjustment' => 5000,
        'is_available' => true,
    ]);
    $this->menu->optionGroups()->sync([$this->optionGroup->id]);

    $this->table = Meja::factory()->create([
        'outlet_id' => $this->outlet->id,
        'table_token' => Str::random(40),
        'status' => 'available',
    ]);
});

// ─── Show Page ──────────────────────────────────────────────

test('self-order page can be accessed with valid token', function () {
    $this->get(route('self-order.show', $this->table->table_token))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('self-order/Menu'));
});

test('self-order page returns 404 with invalid token', function () {
    $this->get(route('self-order.show', 'invalid-token'))
        ->assertNotFound();
});

test('self-order page shows menu items and categories', function () {
    $this->get(route('self-order.show', $this->table->table_token))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('categories')
            ->has('table')
            ->where('tableToken', $this->table->table_token)
        );
});

test('self-order only shows active categories', function () {
    $inactiveCategory = MenuCategory::factory()->create([
        'outlet_id' => $this->outlet->id,
        'is_active' => false,
    ]);

    $response = $this->get(route('self-order.show', $this->table->table_token));

    $response->assertInertia(fn ($page) => $page
        ->has('categories', 1)
    );
});

test('self-order only shows available menus', function () {
    $menu = Menu::factory()->create([
        'category_id' => $this->category->id,
        'is_available' => false,
    ]);

    $response = $this->get(route('self-order.show', $this->table->table_token));

    $response->assertInertia(fn ($page) => $page
        ->has('categories.0.menus', 1)
    );
});

test('self-order shows table info', function () {
    $this->get(route('self-order.show', $this->table->table_token))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('table.code', $this->table->code)
        );
});

// ─── Store (Create Order) ───────────────────────────────────

test('guest can create order from self-order', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [
            [
                'menu_id' => $this->menu->id,
                'qty' => 2,
                'notes' => 'Tanpa daun bawang',
            ],
        ],
    ])->assertRedirect(route('self-order.show', $this->table->table_token));

    $this->assertDatabaseHas('orders', [
        'order_type' => 'dine_in_qr',
        'status' => 'pending_payment',
        'subtotal' => 50000.00,
        'total' => 50000.00,
    ]);
});

test('self-order creates table session if none active', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1],
        ],
    ]);

    $this->assertDatabaseHas('table_sessions', [
        'table_id' => $this->table->id,
        'status' => 'active',
    ]);
});

test('self-order reuses existing active session', function () {
    $session = $this->table->sessions()->create([
        'opened_at' => now(),
        'status' => 'active',
    ]);

    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1],
        ],
    ]);

    $this->assertDatabaseHas('orders', [
        'table_session_id' => $session->id,
    ]);
});

test('self-order creates order with correct price calculation', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 3, 'notes' => 'Extra pedas'],
        ],
    ]);

    $this->assertDatabaseHas('order_items', [
        'menu_id' => $this->menu->id,
        'qty' => 3,
        'base_price' => 25000.00,
        'total_price' => 75000.00,
        'notes' => 'Extra pedas',
    ]);

    $this->assertDatabaseHas('orders', [
        'subtotal' => 75000.00,
        'total' => 75000.00,
    ]);
});

test('self-order validation requires items array', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [])
        ->assertSessionHasErrors('items');
});

test('self-order validation requires at least one item', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [],
    ])->assertSessionHasErrors('items');
});

test('self-order validation requires valid menu_id', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [
            ['menu_id' => 99999, 'qty' => 1],
        ],
    ])->assertSessionHasErrors('items.0.menu_id');
});

test('self-order validation requires positive qty', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 0],
        ],
    ])->assertSessionHasErrors('items.0.qty');
});

test('self-order can include option items', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [
            [
                'menu_id' => $this->menu->id,
                'qty' => 1,
                'option_ids' => [$this->optionItem->id],
            ],
        ],
    ]);

    $orderItem = OrderItem::first();
    expect($orderItem)->not->toBeNull();

    $this->assertDatabaseHas('order_item_options', [
        'order_item_id' => $orderItem->id,
        'option_item_id' => $this->optionItem->id,
    ]);
});

test('self-order validation requires valid option_item_id', function () {
    $this->post(route('self-order.orders.store', $this->table->table_token), [
        'items' => [
            [
                'menu_id' => $this->menu->id,
                'qty' => 1,
                'option_ids' => [99999],
            ],
        ],
    ])->assertSessionHasErrors('items.0.option_ids.0');
});

test('self-order fails with invalid table token', function () {
    $this->post(route('self-order.orders.store', 'invalid-token'), [
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1],
        ],
    ])->assertNotFound();
});

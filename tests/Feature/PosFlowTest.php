<?php

use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuCategory;
use App\Models\OptionGroup;
use App\Models\OptionItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Owner']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Cashier']);

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
        'is_required' => false,
    ]);
    $this->optionItem = OptionItem::factory()->create([
        'option_group_id' => $this->optionGroup->id,
        'price_adjustment' => 5000,
        'is_available' => true,
    ]);
    $this->menu->optionGroups()->sync([$this->optionGroup->id]);

    $this->table = Meja::factory()->create([
        'outlet_id' => $this->outlet->id,
        'status' => 'available',
    ]);

    $this->cashier = User::factory()->create()->assignRole('Cashier');
    $this->admin = User::factory()->create()->assignRole('Admin');
});

// ─── POS Index Page ──────────────────────────────────────────

test('cashier can view POS index', function () {
    $this->actingAs($this->cashier)
        ->get(route('pos.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('pos/Index'));
});

test('authenticated user can view POS index', function () {
    $user = User::factory()->create();
    $this->actingAs($user)
        ->get(route('pos.index'))
        ->assertOk();
});

// ─── Create Order ────────────────────────────────────────────

test('cashier can create order with cash payment', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 2, 'notes' => null, 'option_ids' => []],
        ],
        'payment_method' => 'cash',
    ])->assertRedirect(route('pos.index'));

    $this->assertDatabaseHas('orders', [
        'order_type' => 'dine_in',
        'status' => 'paid',
        'subtotal' => 50000.00,
        'tax' => 5000.00,
        'service_charge' => 0,
        'total' => 55000.00,
    ]);

    $this->assertDatabaseHas('payments', [
        'method' => 'cash',
        'status' => 'settlement',
        'gross_amount' => 55000.00,
    ]);
});

test('cashier can create order with QRIS payment', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1],
        ],
        'payment_method' => 'qris',
    ])->assertRedirect();

    $this->assertDatabaseHas('payments', [
        'method' => 'qris',
        'status' => 'settlement',
    ]);
});

test('order can be created without payment (save only)', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1],
        ],
    ])->assertRedirect();

    $this->assertDatabaseHas('orders', [
        'order_type' => 'dine_in',
        'status' => 'paid',
    ]);

    $this->assertDatabaseMissing('payments', [
        'order_id' => Order::first()->id,
    ]);
});

test('order includes option items in price calculation', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            [
                'menu_id' => $this->menu->id,
                'qty' => 1,
                'option_ids' => [$this->optionItem->id],
            ],
        ],
        'payment_method' => 'cash',
    ]);

    $this->assertDatabaseHas('orders', [
        'subtotal' => 30000.00,
        'tax' => 3000.00,
        'service_charge' => 0,
        'total' => 33000.00,
    ]);
});

// ─── Validation ──────────────────────────────────────────────

test('order requires at least one item', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [],
    ])->assertSessionHasErrors('items');
});

test('order validation requires valid menu_id', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => 99999, 'qty' => 1],
        ],
    ])->assertSessionHasErrors('items.0.menu_id');
});

test('order creates table session if none active', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1],
        ],
        'payment_method' => 'cash',
    ]);

    $this->assertDatabaseHas('table_sessions', [
        'table_id' => $this->table->id,
        'status' => 'active',
    ]);

    $this->assertDatabaseHas('tables', [
        'id' => $this->table->id,
        'status' => 'occupied',
    ]);
});

// ─── Diskon ──────────────────────────────────────────────────

test('order can apply nominal discount', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 2],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'nominal',
        'discount_value' => 10000,
    ]);

    $this->assertDatabaseHas('orders', [
        'subtotal' => 50000.00,
        'tax' => 5000.00,
        'service_charge' => 0,
        'discount' => 10000.00,
        'discount_type' => 'nominal',
        'discount_value' => 10000.00,
        'total' => 45000.00,
    ]);
});

test('order can apply percentage discount', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 2],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'percentage',
        'discount_value' => 10,
    ]);

    $this->assertDatabaseHas('orders', [
        'subtotal' => 50000.00,
        'tax' => 5000.00,
        'service_charge' => 0,
        'discount' => 5000.00,
        'discount_type' => 'percentage',
        'discount_value' => 10.00,
        'total' => 50000.00,
    ]);
});

test('discount is capped at subtotal', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'nominal',
        'discount_value' => 100000,
        'discount_approved_by' => $this->admin->id,
    ]);

    $this->assertDatabaseHas('orders', [
        'subtotal' => 25000.00,
        'tax' => 2500.00,
        'service_charge' => 0,
        'discount' => 25000.00,
        'total' => 2500.00,
    ]);
});

test('large percentage discount requires admin approval', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 2],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'percentage',
        'discount_value' => 15,
    ])->assertSessionHasErrors('discount');
});

test('large nominal discount requires admin approval', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 2],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'nominal',
        'discount_value' => 60000,
    ])->assertSessionHasErrors('discount');
});

test('large discount with admin approval succeeds', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 4],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'percentage',
        'discount_value' => 20,
        'discount_approved_by' => $this->admin->id,
    ]);

    $this->assertDatabaseHas('orders', [
        'subtotal' => 100000.00,
        'tax' => 10000.00,
        'service_charge' => 0,
        'discount' => 20000.00,
        'discount_approved_by' => $this->admin->id,
        'total' => 90000.00,
    ]);
});

test('large discount with non-admin approver fails', function () {
    $cashier2 = User::factory()->create()->assignRole('Cashier');
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 4],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'percentage',
        'discount_value' => 20,
        'discount_approved_by' => $cashier2->id,
    ])->assertSessionHasErrors('discount');
});

// ─── Split Bill ──────────────────────────────────────────────

test('order can be split into multiple bills', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 4],
        ],
        'payment_method' => 'cash',
        'split_count' => 2,
    ]);

    $orders = Order::where('order_type', 'dine_in')->get();
    expect($orders)->toHaveCount(2);
    expect($orders[0]->subtotal + $orders[1]->subtotal)->toBe(100000.00);
    expect((float) $orders[0]->tax + (float) $orders[1]->tax)->toBe(10000.00);
    expect((float) $orders[0]->service_charge + (float) $orders[1]->service_charge)->toBe(0.0);
    expect($orders[0]->total + $orders[1]->total)->toBe(110000.00);
});

test('split with discount divides discount proportionally', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 4],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'nominal',
        'discount_value' => 10000,
        'split_count' => 2,
    ]);

    $orders = Order::where('order_type', 'dine_in')->get();
    expect($orders)->toHaveCount(2);
    expect((float) $orders[0]->discount)->toEqual(5000.00);
    expect((float) $orders[1]->discount)->toEqual(5000.00);
});

test('split bill validates max count', function () {
    $this->actingAs($this->cashier)->post(route('pos.orders.store'), [
        'table_id' => $this->table->id,
        'items' => [
            ['menu_id' => $this->menu->id, 'qty' => 1],
        ],
        'payment_method' => 'cash',
        'split_count' => 25,
    ])->assertSessionHasErrors('split_count');
});

// ─── Confirm Pending Payment ─────────────────────────────────

test('can confirm pending payment from self-order', function () {
    $order = Order::factory()->create([
        'status' => 'pending',
        'order_type' => 'dine_in_qr',
        'subtotal' => 25000,
        'total' => 25000,
    ]);
    $order->items()->create([
        'menu_id' => $this->menu->id,
        'qty' => 1,
        'base_price' => 25000,
        'total_price' => 25000,
    ]);

    $this->actingAs($this->cashier)->put(route('pos.orders.confirm-pay', $order), [
        'items' => [
            [
                'id' => $order->items->first()->id,
                'menu_id' => $this->menu->id,
                'qty' => 1,
                'option_ids' => [],
            ],
        ],
        'payment_method' => 'cash',
    ])->assertRedirect(route('pos.index'));

    $this->assertDatabaseHas('orders', [
        'id' => $order->id,
        'status' => 'paid',
    ]);

    $this->assertDatabaseHas('payments', [
        'order_id' => $order->id,
        'method' => 'cash',
        'status' => 'settlement',
    ]);
});

test('confirm pay with discount', function () {
    $order = Order::factory()->create([
        'status' => 'pending',
        'order_type' => 'dine_in_qr',
        'subtotal' => 25000,
        'total' => 25000,
    ]);
    $order->items()->create([
        'menu_id' => $this->menu->id,
        'qty' => 1,
        'base_price' => 25000,
        'total_price' => 25000,
    ]);

    $this->actingAs($this->cashier)->put(route('pos.orders.confirm-pay', $order), [
        'items' => [
            [
                'id' => $order->items->first()->id,
                'menu_id' => $this->menu->id,
                'qty' => 1,
                'option_ids' => [],
            ],
        ],
        'payment_method' => 'cash',
        'discount_type' => 'nominal',
        'discount_value' => 5000,
    ]);

    $this->assertDatabaseHas('orders', [
        'id' => $order->id,
        'subtotal' => 25000.00,
        'tax' => 2500.00,
        'service_charge' => 0,
        'discount' => 5000.00,
        'total' => 22500.00,
    ]);
});

test('cannot confirm non-pending order', function () {
    $order = Order::factory()->create(['status' => 'paid']);

    $this->actingAs($this->cashier)
        ->put(route('pos.orders.confirm-pay', $order), [
            'items' => [
                ['menu_id' => $this->menu->id, 'qty' => 1, 'option_ids' => []],
            ],
            'payment_method' => 'cash',
        ])
        ->assertForbidden();
});

// ─── Verify Approval ─────────────────────────────────────────

test('admin can verify approval with password', function () {
    $this->admin->password = bcrypt('password123');
    $this->admin->save();

    $this->actingAs($this->admin)
        ->postJson(route('pos.verify-approval'), [
            'password' => 'password123',
        ])
        ->assertOk()
        ->assertJson(['approved_by' => $this->admin->id]);
});

test('verify approval fails with wrong password', function () {
    $this->admin->password = bcrypt('password123');
    $this->admin->save();

    $this->actingAs($this->admin)
        ->postJson(route('pos.verify-approval'), [
            'password' => 'wrong-password',
        ])
        ->assertStatus(422);
});

test('cashier cannot approve discount', function () {
    $this->actingAs($this->cashier)
        ->postJson(route('pos.verify-approval'), [
            'password' => 'anything',
        ])
        ->assertStatus(403);
});

<?php

use App\Events\OrderPaid;
use App\Jobs\DeductStockOnOrderPaid;
use App\Models\Employee;
use App\Models\Ingredient;
use App\Models\Meja;
use App\Models\Menu;
use App\Models\MenuRecipe;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\StockMovement;
use App\Models\TableSession;
use App\Models\User;
use App\Services\StockMovementService;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();

    $this->outlet = Outlet::factory()->create();
    $this->user = User::factory()->create();
    Employee::factory()->create(['user_id' => $this->user->id, 'outlet_id' => $this->outlet->id]);

    $this->table = Meja::factory()->create(['outlet_id' => $this->outlet->id]);
    $this->session = TableSession::factory()->create(['table_id' => $this->table->id]);
});

test('order paid event dispatches DeductStockOnOrderPaid job', function () {
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'total' => 50000,
    ]);

    OrderPaid::dispatch($order);

    Queue::assertPushed(DeductStockOnOrderPaid::class, fn ($job) => $job->order->id === $order->id);
});

test('deduct stock job reduces ingredient stock per recipe times qty', function () {
    Queue::fake();

    // Recipe: 0.2 kg ayam + 0.1 kg beras per porsi
    $ayam = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 10,
        'cost_per_unit' => 40000,
        'min_stock' => 2,
    ]);
    $beras = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 20,
        'cost_per_unit' => 12000,
        'min_stock' => 5,
    ]);

    $menu = Menu::factory()->create();
    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $ayam->id,
        'quantity_per_portion' => 0.2,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);
    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $beras->id,
        'quantity_per_portion' => 0.1,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);

    // Order: 3 porsi
    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'total' => 150000,
    ]);
    OrderItem::create([
        'order_id' => $order->id,
        'menu_id' => $menu->id,
        'qty' => 3,
        'base_price' => 50000,
        'total_price' => 150000,
        'status' => 'ready',
    ]);

    (new DeductStockOnOrderPaid($order))->handle(app(StockMovementService::class));

    // Ayam: 10 - (0.2 * 3) = 9.4
    expect((float) $ayam->fresh()->current_stock)->toBe(9.4)
        // Beras: 20 - (0.1 * 3) = 19.7
        ->and((float) $beras->fresh()->current_stock)->toBe(19.7);

    // Stock movements recorded with order reference
    expect(StockMovement::where('reference_type', 'order')->where('reference_id', $order->id)->count())->toBe(2);
});

test('deduct stock skips menus without recipes', function () {
    Queue::fake();

    $menu = Menu::factory()->create();

    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'total' => 50000,
    ]);
    OrderItem::create([
        'order_id' => $order->id,
        'menu_id' => $menu->id,
        'qty' => 1,
        'base_price' => 50000,
        'total_price' => 50000,
        'status' => 'ready',
    ]);

    (new DeductStockOnOrderPaid($order))->handle(app(StockMovementService::class));

    expect(StockMovement::where('type', 'out')->count())->toBe(0);
});

test('deduct stock continues when one ingredient runs out', function () {
    Queue::fake();

    // Stok habis untuk ayam
    $ayam = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 0,
        'cost_per_unit' => 40000,
    ]);
    $beras = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 20,
        'cost_per_unit' => 12000,
    ]);

    $menu = Menu::factory()->create();
    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $ayam->id,
        'quantity_per_portion' => 0.2,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);
    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $beras->id,
        'quantity_per_portion' => 0.1,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);

    $order = Order::factory()->create([
        'table_session_id' => $this->session->id,
        'status' => 'paid',
        'total' => 50000,
    ]);
    OrderItem::create([
        'order_id' => $order->id,
        'menu_id' => $menu->id,
        'qty' => 1,
        'base_price' => 50000,
        'total_price' => 50000,
        'status' => 'ready',
    ]);

    // Tidak throw — hanya log error
    (new DeductStockOnOrderPaid($order))->handle(app(StockMovementService::class));

    // Beras tetap terpotong meskipun ayam gagal
    expect((float) $beras->fresh()->current_stock)->toBe(19.9);
});

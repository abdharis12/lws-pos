<?php

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\MenuRecipe;
use App\Models\Outlet;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Services\ProcurementService;
use App\Services\StockMovementService;

beforeEach(function () {
    $this->service = app(ProcurementService::class);
    $this->outlet = Outlet::factory()->create();
    $this->supplier = Supplier::factory()->create(['outlet_id' => $this->outlet->id]);
    $this->ingredient = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 0,
        'cost_per_unit' => 0,
    ]);
});

test('create po generates number and calculates total', function () {
    $po = $this->service->createPo($this->outlet->id, [
        'supplier_id' => $this->supplier->id,
        'items' => [
            ['ingredient_id' => $this->ingredient->id, 'qty_ordered' => 10, 'unit_cost' => 5000],
            ['ingredient_id' => Ingredient::factory()->create(['outlet_id' => $this->outlet->id])->id, 'qty_ordered' => 5, 'unit_cost' => 8000],
        ],
    ]);

    expect($po->po_number)->toStartWith('PO-')
        ->and($po->status)->toBe('draft')
        ->and((float) $po->total_amount)->toBe(90000.0);
});

test('send and cancel enforce status transitions', function () {
    $po = PurchaseOrder::factory()->create([
        'outlet_id' => $this->outlet->id,
        'supplier_id' => $this->supplier->id,
        'status' => 'sent',
    ]);

    // Tidak bisa kirim ulang PO yang sudah sent
    $this->service->sendPo($po);
})->throws(InvalidArgumentException::class);

test('grn received updates stock with moving average cost', function () {
    // Beli pertama: 10 kg @ Rp5.000
    app(StockMovementService::class)->recordIn($this->outlet->id, $this->ingredient->id, 10, 5000, 'Beli #1');

    // Buat PO untuk beli kedua: 20 kg @ Rp8.000
    $po = PurchaseOrder::factory()->has(PurchaseOrderItem::factory()->state([
        'ingredient_id' => $this->ingredient->id,
        'qty_ordered' => 20,
        'qty_received' => 0,
        'unit_cost' => 8000,
    ]), 'items')->create([
        'outlet_id' => $this->outlet->id,
        'supplier_id' => $this->supplier->id,
        'status' => 'sent',
    ]);

    $grn = $this->service->createGrn($po->id, [
        'items' => [
            ['ingredient_id' => $this->ingredient->id, 'qty_received' => 20, 'unit_cost' => 8000],
        ],
    ]);

    expect($grn->status)->toBe('completed');

    // MAC = (50.000 + 160.000) / 30 = 7.000
    $mac = (float) $this->ingredient->fresh()->cost_per_unit;
    expect(round($mac, 2))->toBe(7000.0)
        ->and((float) $this->ingredient->fresh()->current_stock)->toBe(30.0);

    // Stock movement tercatat dengan referensi GRN
    expect(StockMovement::where('type', 'in')->where('reference_type', 'goods_received_note')->where('reference_id', $grn->id)->count())->toBe(1);
});

test('partial grn sets po status to partial', function () {
    $po = PurchaseOrder::factory()->has(PurchaseOrderItem::factory()->count(2)->sequence(
        ['ingredient_id' => $this->ingredient->id, 'qty_ordered' => 10, 'unit_cost' => 5000],
        ['ingredient_id' => Ingredient::factory()->create(['outlet_id' => $this->outlet->id])->id, 'qty_ordered' => 8, 'unit_cost' => 3000],
    ), 'items')->create([
        'outlet_id' => $this->outlet->id,
        'supplier_id' => $this->supplier->id,
        'status' => 'sent',
    ]);

    // Terima hanya item pertama
    $grn = $this->service->createGrn($po->id, [
        'items' => [
            ['ingredient_id' => $this->ingredient->id, 'qty_received' => 6, 'unit_cost' => 5000],
        ],
    ]);

    expect($grn->status)->toBe('partial')
        ->and($po->fresh()->status)->toBe('partial');
});

test('grn recalculates affected menu hpp via cost change event', function () {
    // Menu dengan resep menggunakan ingredient ini
    $menu = Menu::factory()->create();
    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $this->ingredient->id,
        'quantity_per_portion' => 0.5,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);

    // Set cost awal & sinkronkan HPP menu dengan resep
    $this->ingredient->update(['cost_per_unit' => 20000]);
    $menu->updateCostFromRecipes();
    $initialHpp = (float) $menu->fresh()->cost;
    expect($initialHpp)->toBe(10000.0);

    $po = PurchaseOrder::factory()->has(PurchaseOrderItem::factory()->state([
        'ingredient_id' => $this->ingredient->id,
        'qty_ordered' => 50,
        'unit_cost' => 40000,
    ]), 'items')->create([
        'outlet_id' => $this->outlet->id,
        'supplier_id' => $this->supplier->id,
        'status' => 'sent',
    ]);

    // GRN akan trigger IngredientCostChanged → listener update menu cost
    $this->service->createGrn($po->id, [
        'items' => [
            ['ingredient_id' => $this->ingredient->id, 'qty_received' => 50, 'unit_cost' => 40000],
        ],
    ]);

    // HPP menu harus naik mengikuti MAC baru: ((stok awal 0) → MAC = 40000)
    expect((float) $menu->fresh()->cost)->toBe(20000.0);
});

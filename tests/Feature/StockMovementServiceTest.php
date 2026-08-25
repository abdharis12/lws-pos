<?php

use App\Models\Ingredient;
use App\Services\StockMovementService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(StockMovementService::class);
    $this->ingredient = Ingredient::factory()->create([
        'current_stock' => 0,
        'cost_per_unit' => 0,
    ]);
});

test('moving average cost starts with incoming cost when stock is empty', function () {
    $movement = $this->service->recordIn(
        $this->ingredient->outlet_id,
        $this->ingredient->id,
        qty: 10,
        unitCost: 5000,
        notes: 'Pembelian pertama',
    );

    expect((float) $this->ingredient->fresh()->cost_per_unit)->toBe(5000.0)
        ->and((float) $this->ingredient->fresh()->current_stock)->toBe(10.0)
        ->and($movement->type)->toBe('in');
});

test('moving average cost blends multiple receipts at different costs', function () {
    // Receipt 1: 10 kg @ Rp5.000
    $this->service->recordIn($this->ingredient->outlet_id, $this->ingredient->id, 10, 5000, 'Beli #1');
    expect((float) $this->ingredient->fresh()->cost_per_unit)->toBe(5000.0);

    // Receipt 2: 20 kg @ Rp8.000 → MAC = (50.000 + 160.000) / 30 = 7.000
    $this->service->recordIn($this->ingredient->outlet_id, $this->ingredient->id, 20, 8000, 'Beli #2');

    $mac = (float) $this->ingredient->fresh()->cost_per_unit;
    expect(round($mac, 4))->toBe(7000.0);

    // Receipt 3: 20 kg @ Rp11.000 → MAC = (210.000 + 220.000) / 50 = 8.600
    $this->service->recordIn($this->ingredient->outlet_id, $this->ingredient->id, 20, 11000, 'Beli #3');

    $mac = (float) $this->ingredient->fresh()->cost_per_unit;
    expect(round($mac, 4))->toBe(8600.0);
});

test('stock out uses moving average cost and reduces stock', function () {
    $this->service->recordIn($this->ingredient->outlet_id, $this->ingredient->id, 10, 5000, 'In');
    $this->service->recordIn($this->ingredient->outlet_id, $this->ingredient->id, 10, 7000, 'In');

    // MAC = 6000
    $movement = $this->service->recordOut(
        $this->ingredient->outlet_id,
        $this->ingredient->id,
        5,
        'Pemakaian resep',
    );

    expect((float) $this->ingredient->fresh()->current_stock)->toBe(15.0)
        ->and((float) $movement->unit_cost)->toBe(6000.0)
        ->and((float) $movement->total_cost)->toBe(-30000.0);
});

test('recordOut rejects when stock is insufficient', function () {
    $this->service->recordIn($this->ingredient->outlet_id, $this->ingredient->id, 5, 4000, 'In');

    $this->service->recordOut($this->ingredient->outlet_id, $this->ingredient->id, 10, 'Overuse');
})->throws(InvalidArgumentException::class);

test('adjustment can increase and decrease stock but not below zero', function () {
    $this->service->recordAdjustment($this->ingredient->outlet_id, $this->ingredient->id, 12, 3000, 'Opname plus');
    expect((float) $this->ingredient->fresh()->current_stock)->toBe(12.0);

    $this->service->recordAdjustment($this->ingredient->outlet_id, $this->ingredient->id, -7, 3000, 'Opname minus');
    expect((float) $this->ingredient->fresh()->current_stock)->toBe(5.0);

    $this->service->recordAdjustment($this->ingredient->outlet_id, $this->ingredient->id, -10, 3000, 'Minus melebihi stok');
})->throws(InvalidArgumentException::class);

test('waste reduces stock at current cost without changing mac', function () {
    $this->service->recordIn($this->ingredient->outlet_id, $this->ingredient->id, 20, 6000, 'In');

    $waste = $this->service->recordWaste(
        $this->ingredient->outlet_id,
        $this->ingredient->id,
        3,
        6000,
        '[spoil] Busuk',
    );

    expect((float) $this->ingredient->fresh()->current_stock)->toBe(17.0)
        ->and($waste->type)->toBe('waste')
        ->and((float) $waste->qty)->toBe(-3.0)
        ->and((float) $this->ingredient->fresh()->cost_per_unit)->toBe(6000.0);
});

test('stock summary counts low stock ingredients', function () {
    $okIngredient = Ingredient::factory()->create([
        'outlet_id' => $this->ingredient->outlet_id,
        'current_stock' => 50,
        'min_stock' => 5,
    ]);
    $lowIngredient = Ingredient::factory()->lowStock()->create([
        'outlet_id' => $this->ingredient->outlet_id,
    ]);

    $summary = $this->service->getStockSummary($this->ingredient->outlet_id);

    expect($summary['total_ingredients'])->toBeGreaterThanOrEqual(2)
        ->and($summary['low_stock_count'])->toBeGreaterThanOrEqual(1)
        ->and($summary['total_stock_value'])->toBeGreaterThan(0);
});

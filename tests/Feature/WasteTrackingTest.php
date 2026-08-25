<?php

use App\Models\Ingredient;
use App\Models\Outlet;
use App\Services\HppCalculationService;
use App\Services\StockMovementService;

beforeEach(function () {
    $this->stockService = app(StockMovementService::class);
    $this->hppService = app(HppCalculationService::class);
    $this->outlet = Outlet::factory()->create();
});

test('waste reduces ingredient stock without revenue impact', function () {
    $ingredient = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 20,
        'cost_per_unit' => 6000,
        'min_stock' => 5,
    ]);

    $movement = $this->stockService->recordWaste(
        $this->outlet->id,
        $ingredient->id,
        4,
        6000,
        '[spoil] Terkena air',
    );

    // Stok berkurang
    expect((float) $ingredient->fresh()->current_stock)->toBe(16.0)
        ->and($movement->type)->toBe('waste')
        ->and((float) $movement->qty)->toBe(-4.0)
        // Cost negatif (beban), bukan pendapatan
        ->and((float) $movement->total_cost)->toBe(-24000.0);

    // MAC tidak berubah karena waste
    expect((float) $ingredient->fresh()->cost_per_unit)->toBe(6000.0);
});

test('waste appears in waste report with correct cost', function () {
    $ingredientA = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 20,
        'cost_per_unit' => 6000,
    ]);
    $ingredientB = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 10,
        'cost_per_unit' => 3000,
    ]);

    $this->stockService->recordWaste($this->outlet->id, $ingredientA->id, 2, 6000, '[spoil] Busuk');
    $this->stockService->recordWaste($this->outlet->id, $ingredientB->id, 1, 3000, '[expired] Kadaluarsa');

    $report = $this->hppService->getWasteReport($this->outlet->id);

    expect($report)->toHaveCount(2);

    $totalWasteCost = $report->sum('total_cost');
    expect($totalWasteCost)->toBe(15000.0);
});

test('waste does not appear in cogs report', function () {
    $ingredient = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 50,
        'cost_per_unit' => 5000,
    ]);

    // Waste dicatat — tidak mempengaruhi COGS penjualan
    $this->stockService->recordWaste($this->outlet->id, $ingredient->id, 5, 5000, '[spoil] Rusak');

    $cogs = $this->hppService->getCogsReport($this->outlet->id, 'daily');

    expect($cogs['summary']['total_cogs'])->toBe(0.0)
        ->and($cogs['summary']['total_revenue'])->toBe(0.0);
});

test('waste rejects when stock insufficient', function () {
    $ingredient = Ingredient::factory()->create([
        'outlet_id' => $this->outlet->id,
        'current_stock' => 1,
        'cost_per_unit' => 5000,
    ]);

    $this->stockService->recordWaste($this->outlet->id, $ingredient->id, 10, 5000, '[spoil] Over-waste');
})->throws(InvalidArgumentException::class);

<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Services\StockMovementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    public function __construct(
        private readonly StockMovementService $stockMovementService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $movements = $this->stockMovementService->getMovements($outletId, [
            'ingredient_id' => $request->ingredient_id,
            'type' => $request->type,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'reference_type' => $request->reference_type,
            'per_page' => 20,
        ]);

        return Inertia::render('admin/stock/Movements', [
            'movements' => $movements,
            'ingredients' => Ingredient::where('outlet_id', $outletId)->orderBy('name')->get(['id', 'name', 'unit']),
            'filters' => $request->only(['ingredient_id', 'type', 'date_from', 'date_to', 'reference_type']),
            'summary' => $this->stockMovementService->getStockSummary($outletId),
        ]);
    }

    public function storeAdjustment(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'qty' => 'required|numeric',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'required|string|max:500',
        ]);

        try {
            $this->stockMovementService->recordAdjustment(
                $this->outletId(),
                $validated['ingredient_id'],
                (float) $validated['qty'],
                (float) ($validated['unit_cost'] ?? 0),
                $validated['notes'],
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Penyesuaian stok berhasil dicatat.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    public function storeWaste(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'qty' => 'required|numeric|min:0.0001',
            'reason' => 'required|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $ingredient = Ingredient::findOrFail($validated['ingredient_id']);

            $this->stockMovementService->recordWaste(
                $this->outletId(),
                $validated['ingredient_id'],
                (float) $validated['qty'],
                (float) $ingredient->cost_per_unit,
                "[{$validated['reason']}] ".($validated['notes'] ?? ''),
                $request->user(),
            );

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Waste berhasil dicatat dan stok dikurangi.']);
        } catch (\InvalidArgumentException $e) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $e->getMessage()]);
        }

        return redirect()->back();
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

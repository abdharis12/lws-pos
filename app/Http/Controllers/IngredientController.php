<?php

namespace App\Http\Controllers;

use App\Events\IngredientCostChanged;
use App\Models\Ingredient;
use App\Models\User;
use App\Notifications\LowStockAlert;
use App\Services\IngredientService;
use App\Services\StockMovementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IngredientController extends Controller
{
    public function __construct(
        private readonly IngredientService $ingredientService,
        private readonly StockMovementService $stockMovementService,
    ) {}

    public function index(Request $request): Response
    {
        $outletId = $this->outletId();

        $ingredients = $this->ingredientService->getAll($outletId, [
            'search' => $request->search,
            'is_active' => $request->is_active,
            'low_stock' => $request->low_stock,
            'per_page' => 15,
        ]);

        return Inertia::render('admin/ingredients/Index', [
            'ingredients' => $ingredients,
            'filters' => $request->only(['search', 'is_active', 'low_stock']),
            'summary' => $this->stockMovementService->getStockSummary($outletId),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateIngredient($request);

        $ingredient = $this->ingredientService->create($this->outletId(), $validated);

        if ($ingredient->isLowStock()) {
            $this->notifyLowStock($ingredient);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bahan baku berhasil ditambahkan.']);

        return redirect()->route('admin.ingredients.index');
    }

    public function show(Ingredient $ingredient): Response
    {
        $history = $this->ingredientService->getStockHistory(
            $this->outletId(),
            $ingredient->id,
            request()->only(['type', 'date_from', 'date_to']),
        );

        return Inertia::render('admin/ingredients/Show', [
            'ingredient' => $ingredient,
            'movements' => $history,
        ]);
    }

    public function update(Request $request, Ingredient $ingredient): RedirectResponse
    {
        $validated = $this->validateIngredient($request);

        $oldCost = (float) $ingredient->cost_per_unit;
        $this->ingredientService->update($ingredient, $validated);
        $newCost = (float) $ingredient->fresh()->cost_per_unit;

        if ($oldCost !== $newCost && ($ingredient->recipes()->exists())) {
            IngredientCostChanged::dispatch($ingredient->id, $ingredient->outlet_id, $oldCost, $newCost, $ingredient->fresh());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bahan baku berhasil diperbarui.']);

        return redirect()->route('admin.ingredients.index');
    }

    public function destroy(Ingredient $ingredient): RedirectResponse
    {
        $deleted = $this->ingredientService->delete($ingredient);

        $message = $deleted
            ? 'Bahan baku berhasil dihapus.'
            : 'Bahan baku sedang dipakai di resep atau memiliki riwayat stok, jadi hanya dinonaktifkan.';
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect()->route('admin.ingredients.index');
    }

    public function stockOpname(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'physical_qty' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $ingredient = Ingredient::findOrFail($validated['ingredient_id']);
        $variance = (float) $validated['physical_qty'] - (float) $ingredient->current_stock;

        if ($variance === 0.0) {
            Inertia::flash('toast', ['type' => 'info', 'message' => 'Tidak ada selisih stok untuk '.$ingredient->name.'.']);

            return redirect()->back();
        }

        $this->stockMovementService->recordAdjustment(
            $this->outletId(),
            $ingredient->id,
            $variance,
            (float) $ingredient->cost_per_unit,
            'Stock opname: '.($validated['notes'] ?? 'Penyesuaian fisik'),
            $request->user(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Stock opname {$ingredient->name} tersimpan. Selisih: ".number_format($variance, 2)." {$ingredient->unit}",
        ]);

        return redirect()->back();
    }

    protected function validateIngredient(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:20',
            'cost_per_unit' => 'nullable|numeric|min:0',
            'current_stock' => 'nullable|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);
    }

    protected function notifyLowStock(Ingredient $ingredient): void
    {
        $users = User::role(['Admin', 'Owner'])->get();
        foreach ($users as $user) {
            $user->notify(new LowStockAlert($ingredient));
        }
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

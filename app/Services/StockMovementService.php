<?php

namespace App\Services;

use App\Events\IngredientCostChanged;
use App\Models\Ingredient;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class StockMovementService
{
    public const COST_METHOD_MAC = 'mac';

    public const COST_METHOD_FIFO = 'fifo';

    protected string $costMethod = self::COST_METHOD_MAC;

    public function setCostMethod(string $method): self
    {
        $this->costMethod = $method;

        return $this;
    }

    public function recordIn(
        int $outletId,
        int $ingredientId,
        float $qty,
        float $unitCost,
        string $notes,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?User $user = null
    ): StockMovement {
        return DB::transaction(function () use ($outletId, $ingredientId, $qty, $unitCost, $notes, $referenceType, $referenceId, $user) {
            $ingredient = Ingredient::lockForUpdate()->findOrFail($ingredientId);

            $oldCostPerUnit = (float) $ingredient->cost_per_unit;
            $newCostPerUnit = $this->calculateMovingAverageCost($ingredient, $qty, $unitCost);

            $ingredient->increment('current_stock', $qty);
            $ingredient->update(['cost_per_unit' => $newCostPerUnit]);

            if ($oldCostPerUnit !== $newCostPerUnit) {
                IngredientCostChanged::dispatch(
                    $ingredientId,
                    $outletId,
                    $oldCostPerUnit,
                    $newCostPerUnit,
                    $ingredient->fresh(),
                );
            }

            return StockMovement::create([
                'outlet_id' => $outletId,
                'ingredient_id' => $ingredientId,
                'type' => 'in',
                'qty' => $qty,
                'unit_cost' => $unitCost,
                'total_cost' => $qty * $unitCost,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
                'user_id' => $user?->id,
            ]);
        });
    }

    public function recordOut(
        int $outletId,
        int $ingredientId,
        float $qty,
        string $notes,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?User $user = null
    ): StockMovement {
        return DB::transaction(function () use ($outletId, $ingredientId, $qty, $notes, $referenceType, $referenceId, $user) {
            $ingredient = Ingredient::lockForUpdate()->findOrFail($ingredientId);

            if ($ingredient->current_stock < $qty) {
                throw new \InvalidArgumentException("Stok tidak mencukupi. Tersedia: {$ingredient->current_stock}, Dibutuhkan: {$qty}");
            }

            $unitCost = $ingredient->cost_per_unit;

            $ingredient->decrement('current_stock', $qty);

            return StockMovement::create([
                'outlet_id' => $outletId,
                'ingredient_id' => $ingredientId,
                'type' => 'out',
                'qty' => -$qty,
                'unit_cost' => $unitCost,
                'total_cost' => -($qty * $unitCost),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes,
                'user_id' => $user?->id,
            ]);
        });
    }

    public function recordAdjustment(
        int $outletId,
        int $ingredientId,
        float $qty,
        float $unitCost,
        string $notes,
        ?User $user = null
    ): StockMovement {
        return DB::transaction(function () use ($outletId, $ingredientId, $qty, $unitCost, $notes, $user) {
            $ingredient = Ingredient::lockForUpdate()->findOrFail($ingredientId);

            $newStock = $ingredient->current_stock + $qty;

            if ($newStock < 0) {
                throw new \InvalidArgumentException("Stok tidak boleh negatif. Stok saat ini: {$ingredient->current_stock}");
            }

            $ingredient->update(['current_stock' => $newStock]);

            return StockMovement::create([
                'outlet_id' => $outletId,
                'ingredient_id' => $ingredientId,
                'type' => 'adjustment',
                'qty' => $qty,
                'unit_cost' => $unitCost,
                'total_cost' => $qty * $unitCost,
                'notes' => $notes,
                'user_id' => $user?->id,
            ]);
        });
    }

    public function recordWaste(
        int $outletId,
        int $ingredientId,
        float $qty,
        float $unitCost,
        string $notes,
        ?User $user = null
    ): StockMovement {
        return DB::transaction(function () use ($outletId, $ingredientId, $qty, $unitCost, $notes, $user) {
            $ingredient = Ingredient::lockForUpdate()->findOrFail($ingredientId);

            if ($ingredient->current_stock < $qty) {
                throw new \InvalidArgumentException("Stok tidak mencukupi untuk waste. Tersedia: {$ingredient->current_stock}");
            }

            $ingredient->decrement('current_stock', $qty);

            return StockMovement::create([
                'outlet_id' => $outletId,
                'ingredient_id' => $ingredientId,
                'type' => 'waste',
                'qty' => -$qty,
                'unit_cost' => $unitCost,
                'total_cost' => -($qty * $unitCost),
                'notes' => $notes,
                'user_id' => $user?->id,
            ]);
        });
    }

    public function recordTransfer(
        int $fromOutletId,
        int $toOutletId,
        int $ingredientId,
        float $qty,
        float $unitCost,
        string $notes,
        ?User $user = null
    ): array {
        return DB::transaction(function () use ($fromOutletId, $toOutletId, $ingredientId, $qty, $unitCost, $notes, $user) {
            $fromIngredient = Ingredient::lockForUpdate()->where('outlet_id', $fromOutletId)->where('id', $ingredientId)->firstOrFail();
            $toIngredient = Ingredient::lockForUpdate()->where('outlet_id', $toOutletId)->where('id', $ingredientId)->firstOrFail();

            if ($fromIngredient->current_stock < $qty) {
                throw new \InvalidArgumentException('Stok outlet asal tidak mencukupi.');
            }

            $fromIngredient->decrement('current_stock', $qty);
            $toIngredient->increment('current_stock', $qty);

            $outMovement = StockMovement::create([
                'outlet_id' => $fromOutletId,
                'ingredient_id' => $ingredientId,
                'type' => 'transfer',
                'qty' => -$qty,
                'unit_cost' => $unitCost,
                'total_cost' => -($qty * $unitCost),
                'notes' => "Transfer ke outlet {$toIngredient->outlet->name}: {$notes}",
                'user_id' => $user?->id,
            ]);

            $inMovement = StockMovement::create([
                'outlet_id' => $toOutletId,
                'ingredient_id' => $ingredientId,
                'type' => 'transfer',
                'qty' => $qty,
                'unit_cost' => $unitCost,
                'total_cost' => $qty * $unitCost,
                'notes' => "Transfer dari outlet {$fromIngredient->outlet->name}: {$notes}",
                'user_id' => $user?->id,
            ]);

            return ['out' => $outMovement, 'in' => $inMovement];
        });
    }

    protected function calculateMovingAverageCost(Ingredient $ingredient, float $incomingQty, float $incomingUnitCost): float
    {
        $currentStock = $ingredient->current_stock;
        $currentCost = $ingredient->cost_per_unit;

        if ($currentStock <= 0) {
            return $incomingUnitCost;
        }

        $totalValue = ($currentStock * $currentCost) + ($incomingQty * $incomingUnitCost);
        $totalQty = $currentStock + $incomingQty;

        return $totalQty > 0 ? $totalValue / $totalQty : $incomingUnitCost;
    }

    public function getMovements(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = StockMovement::where('outlet_id', $outletId)
            ->with(['ingredient', 'user', 'reference'])
            ->latest();

        if (! empty($filters['ingredient_id'])) {
            $query->where('ingredient_id', $filters['ingredient_id']);
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['reference_type'])) {
            $query->where('reference_type', $filters['reference_type']);
        }

        return $query->paginate($filters['per_page'] ?? 20);
    }

    public function getStockSummary(int $outletId): array
    {
        $ingredients = Ingredient::where('outlet_id', $outletId)
            ->where('is_active', true)
            ->get();

        $totalValue = $ingredients->sum(fn ($i) => $i->current_stock * $i->cost_per_unit);
        $lowStockCount = $ingredients->filter(fn ($i) => $i->isLowStock())->count();

        return [
            'total_ingredients' => $ingredients->count(),
            'total_stock_value' => $totalValue,
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $ingredients->filter(fn ($i) => $i->current_stock <= 0)->count(),
        ];
    }
}

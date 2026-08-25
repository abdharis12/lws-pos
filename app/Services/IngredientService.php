<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class IngredientService
{
    public function getAll(int $outletId, array $filters = []): LengthAwarePaginator
    {
        $query = Ingredient::where('outlet_id', $outletId)
            ->with(['outlet'])
            ->orderBy('name');

        if (! empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if (! empty($filters['low_stock'])) {
            $query->whereRaw('current_stock <= min_stock');
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(int $outletId, array $data): Ingredient
    {
        return DB::transaction(function () use ($outletId, $data) {
            $ingredient = Ingredient::create([
                'outlet_id' => $outletId,
                'name' => $data['name'],
                'unit' => $data['unit'],
                'cost_per_unit' => $data['cost_per_unit'] ?? 0,
                'current_stock' => $data['current_stock'] ?? 0,
                'min_stock' => $data['min_stock'] ?? 0,
                'is_active' => $data['is_active'] ?? true,
            ]);

            if (($data['current_stock'] ?? 0) > 0) {
                $this->recordInitialStock($ingredient, $data['current_stock'], $data['cost_per_unit'] ?? 0, $data['notes'] ?? 'Stok awal');
            }

            return $ingredient;
        });
    }

    public function update(Ingredient $ingredient, array $data): Ingredient
    {
        $ingredient->update($data);

        return $ingredient->fresh();
    }

    public function delete(Ingredient $ingredient): bool
    {
        if ($ingredient->stockMovements()->exists() || $ingredient->recipes()->exists()) {
            $ingredient->update(['is_active' => false]);

            return true;
        }

        return $ingredient->delete();
    }

    public function adjustStock(Ingredient $ingredient, float $qty, float $unitCost, string $notes, ?User $user = null): StockMovement
    {
        return DB::transaction(function () use ($ingredient, $qty, $unitCost, $notes, $user) {
            $previousStock = $ingredient->current_stock;
            $newStock = $previousStock + $qty;

            $ingredient->update(['current_stock' => $newStock]);

            $movement = StockMovement::create([
                'outlet_id' => $ingredient->outlet_id,
                'ingredient_id' => $ingredient->id,
                'type' => 'adjustment',
                'qty' => $qty,
                'unit_cost' => $unitCost,
                'total_cost' => $qty * $unitCost,
                'notes' => $notes,
                'user_id' => $user?->id,
            ]);

            return $movement;
        });
    }

    public function recordWaste(Ingredient $ingredient, float $qty, float $unitCost, string $notes, ?User $user = null): StockMovement
    {
        return DB::transaction(function () use ($ingredient, $qty, $unitCost, $notes, $user) {
            $ingredient->decrement('current_stock', $qty);

            return StockMovement::create([
                'outlet_id' => $ingredient->outlet_id,
                'ingredient_id' => $ingredient->id,
                'type' => 'waste',
                'qty' => -$qty,
                'unit_cost' => $unitCost,
                'total_cost' => -($qty * $unitCost),
                'notes' => $notes,
                'user_id' => $user?->id,
            ]);
        });
    }

    public function checkLowStock(int $outletId): Collection
    {
        return Ingredient::where('outlet_id', $outletId)
            ->where('is_active', true)
            ->whereRaw('current_stock <= min_stock')
            ->get();
    }

    public function recordInitialStock(Ingredient $ingredient, float $qty, float $unitCost, string $notes): StockMovement
    {
        return StockMovement::create([
            'outlet_id' => $ingredient->outlet_id,
            'ingredient_id' => $ingredient->id,
            'type' => 'in',
            'qty' => $qty,
            'unit_cost' => $unitCost,
            'total_cost' => $qty * $unitCost,
            'notes' => $notes,
            'reference_type' => 'initial_stock',
        ]);
    }

    public function getStockHistory(int $outletId, int $ingredientId, array $filters = []): LengthAwarePaginator
    {
        $query = StockMovement::where('outlet_id', $outletId)
            ->where('ingredient_id', $ingredientId)
            ->with(['user', 'reference'])
            ->latest();

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->paginate($filters['per_page'] ?? 20);
    }
}

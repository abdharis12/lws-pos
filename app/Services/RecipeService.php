<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\MenuRecipe;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class RecipeService
{
    public function getRecipesForMenu(int $menuId): Collection
    {
        return MenuRecipe::where('menu_id', $menuId)
            ->with(['ingredient'])
            ->orderBy('id')
            ->get();
    }

    public function addRecipe(int $menuId, array $data): MenuRecipe
    {
        return DB::transaction(function () use ($menuId, $data) {
            $recipe = MenuRecipe::create([
                'menu_id' => $menuId,
                'ingredient_id' => $data['ingredient_id'],
                'quantity_per_portion' => $data['quantity_per_portion'],
                'unit' => $data['unit'],
                'yield_percentage' => $data['yield_percentage'] ?? 100,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->recalculateMenuCost($menuId);

            return $recipe;
        });
    }

    public function updateRecipe(MenuRecipe $recipe, array $data): MenuRecipe
    {
        return DB::transaction(function () use ($recipe, $data) {
            $recipe->update($data);
            $this->recalculateMenuCost($recipe->menu_id);

            return $recipe->fresh();
        });
    }

    public function deleteRecipe(MenuRecipe $recipe): bool
    {
        $menuId = $recipe->menu_id;
        $result = $recipe->delete();
        $this->recalculateMenuCost($menuId);

        return $result;
    }

    public function recalculateMenuCost(int $menuId): void
    {
        $menu = Menu::find($menuId);
        if ($menu) {
            $menu->updateCostFromRecipes();
        }
    }

    public function calculateMenuHpp(int $menuId): float
    {
        $menu = Menu::with('recipes.ingredient')->find($menuId);
        if (! $menu) {
            return 0;
        }

        return $menu->calculateHpp();
    }

    public function bulkUpdateMenuCosts(int $outletId): int
    {
        $menus = Menu::whereHas('category', fn ($q) => $q->where('outlet_id', $outletId))
            ->with('recipes.ingredient')
            ->get();

        $count = 0;
        foreach ($menus as $menu) {
            $newCost = $menu->calculateHpp();
            if ($menu->cost != $newCost) {
                $menu->update(['cost' => $newCost]);
                $count++;
            }
        }

        return $count;
    }

    public function getMenusWithoutRecipe(int $outletId): Collection
    {
        return Menu::whereHas('category', fn ($q) => $q->where('outlet_id', $outletId))
            ->whereDoesntHave('recipes')
            ->with('category')
            ->get();
    }

    public function getIngredientUsage(int $ingredientId): Collection
    {
        return MenuRecipe::where('ingredient_id', $ingredientId)
            ->with(['menu.category'])
            ->get();
    }

    public function validateRecipe(Menu $menu): array
    {
        $recipes = $menu->recipes()->with('ingredient')->get();
        $errors = [];

        if ($recipes->isEmpty()) {
            $errors[] = 'Menu tidak memiliki resep (bahan baku).';
        }

        foreach ($recipes as $recipe) {
            if (! $recipe->ingredient->is_active) {
                $errors[] = "Bahan baku '{$recipe->ingredient->name}' tidak aktif.";
            }
            if ($recipe->quantity_per_portion <= 0) {
                $errors[] = "Jumlah per porsi untuk '{$recipe->ingredient->name}' harus > 0.";
            }
            if ($recipe->yield_percentage <= 0 || $recipe->yield_percentage > 100) {
                $errors[] = "Yield untuk '{$recipe->ingredient->name}' harus antara 1-100%.";
            }
        }

        return $errors;
    }
}

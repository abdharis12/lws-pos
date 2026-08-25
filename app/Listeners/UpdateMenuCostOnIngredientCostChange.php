<?php

namespace App\Listeners;

use App\Events\IngredientCostChanged;
use App\Models\Menu;
use App\Services\RecipeService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

class UpdateMenuCostOnIngredientCostChange implements ShouldQueue
{
    public function __construct(
        private readonly RecipeService $recipeService
    ) {}

    public function handle(IngredientCostChanged $event): void
    {
        $ingredient = $event->ingredient;
        $ingredientId = $event->ingredientId;
        $outletId = $event->outletId;

        if (! $ingredient) {
            return;
        }

        try {
            $affectedMenus = Menu::whereHas('recipes', fn ($q) => $q->where('ingredient_id', $ingredientId))
                ->with('recipes.ingredient')
                ->get();

            foreach ($affectedMenus as $menu) {
                $newCost = $menu->calculateHpp();

                if ((float) $menu->cost !== (float) $newCost) {
                    $menu->update(['cost' => $newCost]);

                    Log::info('Menu cost updated due to ingredient cost change', [
                        'menu_id' => $menu->id,
                        'old_cost' => $menu->getOriginal('cost'),
                        'new_cost' => $newCost,
                        'triggered_by_ingredient_id' => $ingredientId,
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to update menu costs', [
                'ingredient_id' => $ingredientId,
                'outlet_id' => $outletId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

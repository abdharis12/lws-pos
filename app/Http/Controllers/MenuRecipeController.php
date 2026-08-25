<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\MenuRecipe;
use App\Services\RecipeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuRecipeController extends Controller
{
    public function __construct(
        private readonly RecipeService $recipeService,
    ) {}

    public function index(Request $request, Menu $menu): Response
    {
        $recipes = $this->recipeService->getRecipesForMenu($menu->id);
        $ingredients = Ingredient::where('outlet_id', $this->outletId())
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/menus/Recipe', [
            'menu' => $menu->load(['category', 'recipes']),
            'recipes' => $recipes,
            'availableIngredients' => $ingredients,
            'hpp' => $this->recipeService->calculateMenuHpp($menu->id),
            'validation' => $this->recipeService->validateRecipe($menu),
        ]);
    }

    public function store(Request $request, Menu $menu): RedirectResponse
    {
        $validated = $this->validateRecipeItem($request);

        if (MenuRecipe::where('menu_id', $menu->id)->where('ingredient_id', $validated['ingredient_id'])->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Bahan baku ini sudah ada di resep menu.']);

            return redirect()->back();
        }

        $this->recipeService->addRecipe($menu->id, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bahan baku ditambahkan ke resep.']);

        return redirect()->back();
    }

    public function update(Request $request, MenuRecipe $recipe): RedirectResponse
    {
        $validated = $this->validateRecipeItem($request, requireIngredient: false);

        $this->recipeService->updateRecipe($recipe, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Resep berhasil diperbarui. HPP menu otomatis dihitung ulang.']);

        return redirect()->back();
    }

    public function destroy(MenuRecipe $recipe): RedirectResponse
    {
        $this->recipeService->deleteRecipe($recipe);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bahan baku dihapus dari resep.']);

        return redirect()->back();
    }

    public function recalculate(Request $request, Menu $menu): RedirectResponse
    {
        $this->recipeService->recalculateMenuCost($menu->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => "HPP {$menu->name} berhasil dihitung ulang."]);

        return redirect()->back();
    }

    protected function validateRecipeItem(Request $request, bool $requireIngredient = true): array
    {
        $rules = [
            'quantity_per_portion' => 'required|numeric|min:0.0001',
            'unit' => 'required|string|max:20',
            'yield_percentage' => 'required|numeric|min:0.01|max:100',
            'notes' => 'nullable|string|max:500',
        ];

        if ($requireIngredient) {
            $rules['ingredient_id'] = 'required|exists:ingredients,id';
        }

        return $request->validate($rules);
    }

    protected function outletId(): int
    {
        $outletId = auth()->user()?->employee?->outlet_id;
        abort_if(! $outletId, 403, 'User tidak terkait dengan outlet manapun.');

        return $outletId;
    }
}

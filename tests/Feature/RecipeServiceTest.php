<?php

use App\Models\Ingredient;
use App\Models\Menu;
use App\Models\MenuRecipe;
use App\Services\RecipeService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(RecipeService::class);
});

test('calculateHpp returns zero for menu without recipes', function () {
    $menu = Menu::factory()->create();

    expect($menu->calculateHpp())->toBe(0.0);
});

test('calculateHpp sums effective cost of all recipes', function () {
    $ingredientA = Ingredient::factory()->create(['cost_per_unit' => 10000]);
    $ingredientB = Ingredient::factory()->create(['cost_per_unit' => 20000]);

    $menu = Menu::factory()->create();

    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $ingredientA->id,
        'quantity_per_portion' => 0.2,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);

    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $ingredientB->id,
        'quantity_per_portion' => 0.1,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);

    $menu->refresh();

    // 0.2 * 10000 + 0.1 * 20000 = 2000 + 2000 = 4000
    expect($menu->calculateHpp())->toBe(4000.0);
});

test('calculateHpp accounts for yield percentage', function () {
    $ingredient = Ingredient::factory()->create(['cost_per_unit' => 50000]);

    $menu = Menu::factory()->create();

    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $ingredient->id,
        'quantity_per_portion' => 0.25,
        'unit' => 'kg',
        'yield_percentage' => 80,
    ]);

    $menu->refresh();

    // (0.25 * 50000) / (80 / 100) = 12500 / 0.8 = 15625
    expect($menu->calculateHpp())->toBe(15625.0);
});

test('effective cost handles zero yield percentage safely', function () {
    $ingredient = Ingredient::factory()->create(['cost_per_unit' => 10000]);

    $recipe = MenuRecipe::create([
        'menu_id' => Menu::factory()->create()->id,
        'ingredient_id' => $ingredient->id,
        'quantity_per_portion' => 0.5,
        'unit' => 'kg',
        'yield_percentage' => 0,
    ]);

    expect($recipe->effective_cost)->toBe(0.0);
});

test('updateCostFromRecipes persists calculated HPP to menu cost column', function () {
    $ingredient = Ingredient::factory()->create(['cost_per_unit' => 30000]);

    $menu = Menu::factory()->create(['price' => 50000]);

    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $ingredient->id,
        'quantity_per_portion' => 0.1,
        'unit' => 'kg',
        'yield_percentage' => 90,
    ]);

    $menu->refresh();
    $menu->updateCostFromRecipes();
    $menu->refresh();

    // (0.1 * 30000) / 0.9 = 3333.3333
    expect((float) $menu->cost)->toBeGreaterThan(3300)
        ->toBeLessThan(3400);

    // margin attribute uses persisted cost
    $expectedMargin = ((50000 - (float) $menu->cost) / 50000) * 100;
    expect($menu->margin)->toBeGreaterThan(93.0);
});

test('addRecipe recalculates menu cost automatically', function () {
    $ingredient = Ingredient::factory()->create(['cost_per_unit' => 15000]);
    $menu = Menu::factory()->create(['price' => 40000]);

    expect((float) $menu->fresh()->cost)->toBe(0.0);

    $this->service->addRecipe($menu->id, [
        'ingredient_id' => $ingredient->id,
        'quantity_per_portion' => 0.3,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);

    expect((float) $menu->fresh()->cost)->toBe(4500.0);
});

test('deleteRecipe recalculates menu cost automatically', function () {
    $ingredient = Ingredient::factory()->create(['cost_per_unit' => 15000]);
    $menu = Menu::factory()->create(['price' => 40000]);

    $recipe = $this->service->addRecipe($menu->id, [
        'ingredient_id' => $ingredient->id,
        'quantity_per_portion' => 0.3,
        'unit' => 'kg',
        'yield_percentage' => 100,
    ]);

    expect((float) $menu->fresh()->cost)->toBe(4500.0);

    $this->service->deleteRecipe($recipe);

    expect((float) $menu->fresh()->cost)->toBe(0.0);
});

test('validateRecipe flags missing recipes and invalid values', function () {
    $inactiveIngredient = Ingredient::factory()->create(['is_active' => false]);
    $menu = Menu::factory()->create();

    $errors = $this->service->validateRecipe($menu);
    expect($errors)->toContain('Menu tidak memiliki resep (bahan baku).');

    MenuRecipe::create([
        'menu_id' => $menu->id,
        'ingredient_id' => $inactiveIngredient->id,
        'quantity_per_portion' => -1,
        'unit' => 'kg',
        'yield_percentage' => 120,
    ]);
    $menu->refresh();

    $errors = $this->service->validateRecipe($menu);
    expect($errors)->toHaveCount(3);
});

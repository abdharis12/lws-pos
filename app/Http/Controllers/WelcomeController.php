<?php

namespace App\Http\Controllers;

use App\Models\Menu;
use App\Models\MenuCategory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function __invoke(): Response
    {
        $menuCategories = MenuCategory::query()
            ->with(['menus' => fn (HasMany $query) => $query
                ->where('is_available', true)
                ->orderBy('name')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn (MenuCategory $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'menus' => $category->menus
                    ->map(fn (Menu $menu) => [
                        'id' => (string) $menu->id,
                        'categoryId' => (string) $category->id,
                        'name' => $menu->name,
                        'price' => (float) $menu->price,
                        'description' => $menu->description,
                        'photoPath' => $menu->photo_path,
                    ])
                    ->values(),
            ])
            ->filter(fn (array $category) => $category['menus']->isNotEmpty())
            ->values();

        return Inertia::render('welcome', [
            'menuCategories' => $menuCategories,
        ]);
    }
}

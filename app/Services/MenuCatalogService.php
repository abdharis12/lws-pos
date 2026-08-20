<?php

namespace App\Services;

use App\Models\MenuCategory;
use Illuminate\Support\Facades\Cache;

/**
 * Shared, cached menu catalog used by the POS terminal and the public
 * self-order flow. Invalidation is centralized via truncating the
 * "menu_categories_outlet_{outletId}" key on any menu/category/option write.
 *
 * The cache stores a plain array (not Eloquent models) to avoid
 * serialization issues with nested relations that produce
 * __PHP_Incomplete_Class on retrieval.
 */
class MenuCatalogService
{
    public static function cacheKey(?int $outletId): string
    {
        return "menu_categories_outlet_{$outletId}";
    }

    public static function forget(?int $outletId): void
    {
        if ($outletId !== null) {
            Cache::forget(self::cacheKey($outletId));
        }
    }

    public function getForOutlet(?int $outletId): array
    {
        return Cache::remember(
            self::cacheKey($outletId),
            3600,
            fn () => MenuCategory::query()
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->with(['menus' => fn ($q) => $q->with('optionGroups.optionItems')])
                ->orderBy('sort_order')
                ->get()
                ->map(fn (MenuCategory $category) => [
                    'id' => $category->id,
                    'outlet_id' => $category->outlet_id,
                    'name' => $category->name,
                    'icon' => $category->icon,
                    'sort_order' => $category->sort_order,
                    'is_active' => (bool) $category->is_active,
                    'menus' => $category->menus->map(fn ($menu) => [
                        'id' => $menu->id,
                        'category_id' => $menu->category_id,
                        'name' => $menu->name,
                        'description' => $menu->description,
                        'station' => $menu->station,
                        'price' => (float) $menu->price,
                        'photo_path' => $menu->photo_path,
                        'is_available' => (bool) $menu->is_available,
                        'option_groups' => $menu->optionGroups->map(fn ($group) => [
                            'id' => $group->id,
                            'outlet_id' => $group->outlet_id,
                            'name' => $group->name,
                            'selection_type' => $group->selection_type,
                            'is_required' => (bool) $group->is_required,
                            'min_select' => $group->min_select,
                            'max_select' => $group->max_select,
                            'is_active' => (bool) $group->is_active,
                            'option_items' => $group->optionItems->map(fn ($item) => [
                                'id' => $item->id,
                                'option_group_id' => $item->option_group_id,
                                'name' => $item->name,
                                'price_adjustment' => (float) $item->price_adjustment,
                                'is_available' => (bool) $item->is_available,
                                'sort_order' => $item->sort_order,
                            ])->values()->all(),
                        ])->values()->all(),
                    ])->values()->all(),
                ])->values()->all(),
        );
    }
}

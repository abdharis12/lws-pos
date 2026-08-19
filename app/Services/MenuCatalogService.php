<?php

namespace App\Services;

use App\Models\MenuCategory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Shared, cached menu catalog used by the POS terminal and the public
 * self-order flow. Invalidation is centralized via truncating the
 * "menu_categories_outlet_{outletId}" key on any menu/category/option write.
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

    public function getForOutlet(?int $outletId): Collection
    {
        return Cache::remember(
            self::cacheKey($outletId),
            3600,
            fn () => MenuCategory::query()
                ->where('outlet_id', $outletId)
                ->where('is_active', true)
                ->with(['menus' => fn ($q) => $q->with('optionGroups.optionItems')])
                ->orderBy('sort_order')
                ->get(),
        );
    }
}

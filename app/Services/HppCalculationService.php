<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\OrderItem;
use App\Models\StockMovement;
use Illuminate\Support\Collection;

class HppCalculationService
{
    public function getTheoreticalVsActual(int $outletId, array $filters = []): Collection
    {
        $menus = Menu::whereHas('category', fn ($q) => $q->where('outlet_id', $outletId))
            ->with(['recipes.ingredient', 'category'])
            ->get();

        $dateFrom = $filters['date_from'] ?? now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? now()->endOfMonth();

        $orderItems = OrderItem::whereHas('order', function ($q) use ($outletId, $dateFrom, $dateTo) {
            $q->whereHas('tableSession.table', fn ($t) => $t->where('outlet_id', $outletId))
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->whereIn('status', ['paid', 'completed']);
        })
            ->with(['menu.recipes.ingredient'])
            ->get()
            ->groupBy('menu_id');

        return $menus->map(function (Menu $menu) use ($orderItems) {
            $theoreticalHpp = $menu->calculateHpp();
            $menuItems = $orderItems->get($menu->id, collect());

            $actualTotalCost = $menuItems->sum('total_cost');
            $actualQty = $menuItems->sum('qty');
            $actualHpp = $actualQty > 0 ? $actualTotalCost / $actualQty : 0;

            $variance = $actualHpp - $theoreticalHpp;
            $variancePercent = $theoreticalHpp > 0 ? ($variance / $theoreticalHpp) * 100 : 0;
            $marginPercent = $menu->price > 0 ? (($menu->price - $theoreticalHpp) / $menu->price) * 100 : 0;

            return [
                'menu_id' => $menu->id,
                'menu_name' => $menu->name,
                'category' => $menu->category?->name,
                'price' => $menu->price,
                'theoretical_hpp' => round($theoreticalHpp, 2),
                'actual_hpp' => round($actualHpp, 2),
                'variance' => round($variance, 2),
                'variance_percent' => round($variancePercent, 2),
                'margin_percent' => round($marginPercent, 2),
                'qty_sold' => $actualQty,
                'actual_total_cost' => round($actualTotalCost, 2),
            ];
        })->filter(fn ($m) => $m['qty_sold'] > 0 || $m['theoretical_hpp'] > 0)
            ->values();
    }

    public function getMenuEngineering(int $outletId, array $filters = []): array
    {
        $data = $this->getTheoreticalVsActual($outletId, $filters);

        $avgPopularity = $data->avg('qty_sold');
        $avgMargin = $data->avg('margin_percent');

        $quadrants = [
            'stars' => [],      // High popularity, High margin
            'plowhorses' => [], // High popularity, Low margin
            'puzzles' => [],    // Low popularity, High margin
            'dogs' => [],       // Low popularity, Low margin
        ];

        foreach ($data as $item) {
            $isHighPopularity = $item['qty_sold'] >= $avgPopularity;
            $isHighMargin = $item['margin_percent'] >= $avgMargin;

            if ($isHighPopularity && $isHighMargin) {
                $quadrants['stars'][] = $item;
            } elseif ($isHighPopularity && ! $isHighMargin) {
                $quadrants['plowhorses'][] = $item;
            } elseif (! $isHighPopularity && $isHighMargin) {
                $quadrants['puzzles'][] = $item;
            } else {
                $quadrants['dogs'][] = $item;
            }
        }

        return [
            'quadrants' => $quadrants,
            'averages' => [
                'popularity' => round($avgPopularity, 2),
                'margin' => round($avgMargin, 2),
            ],
            'summary' => [
                'stars' => count($quadrants['stars']),
                'plowhorses' => count($quadrants['plowhorses']),
                'puzzles' => count($quadrants['puzzles']),
                'dogs' => count($quadrants['dogs']),
            ],
        ];
    }

    public function getCogsReport(int $outletId, string $period = 'daily', array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? now()->endOfMonth();

        $groupBy = match ($period) {
            'daily' => 'DATE(created_at)',
            'weekly' => 'YEARWEEK(created_at)',
            'monthly' => 'DATE_FORMAT(created_at, "%Y-%m")',
            default => 'DATE(created_at)',
        };

        $orderItems = OrderItem::whereHas('order', function ($q) use ($outletId, $dateFrom, $dateTo) {
            $q->whereHas('tableSession.table', fn ($t) => $t->where('outlet_id', $outletId))
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->whereIn('status', ['paid', 'completed']);
        })
            ->with(['order'])
            ->selectRaw("{$groupBy} as period, SUM(total_cost) as cogs, SUM(qty * base_price) as revenue")
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $totalCogs = $orderItems->sum('cogs');
        $totalRevenue = $orderItems->sum('revenue');

        return [
            'period' => $period,
            'date_range' => ['from' => $dateFrom->toDateString(), 'to' => $dateTo->toDateString()],
            'summary' => [
                'total_cogs' => round($totalCogs, 2),
                'total_revenue' => round($totalRevenue, 2),
                'cogs_percent' => $totalRevenue > 0 ? round(($totalCogs / $totalRevenue) * 100, 2) : 0,
            ],
            'details' => $orderItems->map(fn ($item) => [
                'period' => $item->period,
                'cogs' => round($item->cogs, 2),
                'revenue' => round($item->revenue, 2),
                'cogs_percent' => $item->revenue > 0 ? round(($item->cogs / $item->revenue) * 100, 2) : 0,
            ])->values(),
        ];
    }

    public function getWasteReport(int $outletId, array $filters = []): Collection
    {
        $query = StockMovement::where('outlet_id', $outletId)
            ->where('type', 'waste')
            ->with(['ingredient', 'user'])
            ->latest();

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['ingredient_id'])) {
            $query->where('ingredient_id', $filters['ingredient_id']);
        }

        return $query->get()->map(fn ($m) => [
            'date' => $m->created_at->toDateString(),
            'ingredient' => $m->ingredient->name,
            'unit' => $m->ingredient->unit,
            'qty' => abs($m->qty),
            'unit_cost' => $m->unit_cost,
            'total_cost' => abs($m->total_cost),
            'notes' => $m->notes,
            'recorded_by' => $m->user?->name,
        ])->values();
    }

    public function getTopVarianceMenus(int $outletId, int $limit = 10): Collection
    {
        return $this->getTheoreticalVsActual($outletId)
            ->sortByDesc('variance_percent')
            ->take($limit)
            ->values();
    }

    public function getLowMarginMenus(int $outletId, float $threshold = 60, int $limit = 10): Collection
    {
        return $this->getTheoreticalVsActual($outletId)
            ->filter(fn ($m) => $m['margin_percent'] < $threshold)
            ->sortBy('margin_percent')
            ->take($limit)
            ->values();
    }

    public function recalculateAllMenuCosts(int $outletId): int
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
}

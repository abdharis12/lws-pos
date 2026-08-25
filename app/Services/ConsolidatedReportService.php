<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Outlet;
use Illuminate\Support\Collection;

class ConsolidatedReportService
{
    public function getGroupPnl(int $ownerId, array $filters = []): array
    {
        $outlets = Outlet::all();

        $dateFrom = $filters['date_from'] ?? now()->startOfMonth();
        $dateTo = $filters['date_to'] ?? now()->endOfMonth();

        $outletData = $outlets->map(function (Outlet $outlet) use ($dateFrom, $dateTo) {
            $revenue = Order::forOutlet($outlet->id)
                ->whereIn('status', ['paid', 'completed'])
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->sum('total');

            $cogs = Order::forOutlet($outlet->id)
                ->whereIn('status', ['paid', 'completed'])
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->withSum('items as total_cogs', 'total_cost')
                ->get()
                ->sum('total_cogs') ?? 0;

            $grossProfit = $revenue - $cogs;
            $marginPercent = $revenue > 0 ? ($grossProfit / $revenue) * 100 : 0;

            return [
                'outlet_id' => $outlet->id,
                'outlet_name' => $outlet->name,
                'revenue' => round($revenue, 2),
                'cogs' => round($cogs, 2),
                'gross_profit' => round($grossProfit, 2),
                'margin_percent' => round($marginPercent, 2),
            ];
        });

        return [
            'date_range' => ['from' => $dateFrom->toDateString(), 'to' => $dateTo->toDateString()],
            'outlets' => $outletData->values(),
            'summary' => [
                'total_revenue' => round($outletData->sum('revenue'), 2),
                'total_cogs' => round($outletData->sum('cogs'), 2),
                'total_gross_profit' => round($outletData->sum('gross_profit'), 2),
                'avg_margin_percent' => round($outletData->avg('margin_percent'), 2),
            ],
        ];
    }

    public function getOutletBenchmark(int $ownerId, array $filters = []): Collection
    {
        $pnl = $this->getGroupPnl($ownerId, $filters);

        return collect($pnl['outlets'])
            ->map(function ($outlet) {
                $outlet['orders_count'] = $this->countOrders($outlet['outlet_id'], $pnl['date_range']);

                return $outlet;
            })
            ->sortByDesc('gross_profit')
            ->values()
            ->map(function ($outlet, $index) {
                $outlet['rank'] = $index + 1;

                return $outlet;
            });
    }

    public function getConsolidatedSummary(int $ownerId, array $filters = []): array
    {
        $pnl = $this->getGroupPnl($ownerId, $filters);

        $totalRevenue = $pnl['summary']['total_revenue'];
        $totalCogs = $pnl['summary']['total_cogs'];

        return [
            'total_revenue' => $totalRevenue,
            'total_cogs' => $totalCogs,
            'total_profit' => round($totalRevenue - $totalCogs, 2),
            'avg_margin' => $totalRevenue > 0 ? round((($totalRevenue - $totalCogs) / $totalRevenue) * 100, 2) : 0,
            'outlets_count' => count($pnl['outlets']),
        ];
    }

    protected function countOrders(int $outletId, array $dateRange): int
    {
        return Order::forOutlet($outletId)
            ->whereIn('status', ['paid', 'completed'])
            ->whereBetween('created_at', [$dateRange['from'], $dateRange['to']])
            ->count();
    }
}

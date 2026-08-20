<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OwnerDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $outletId = $this->outletId();
        $today = today();

        $dashboard = Cache::flexible(
            "owner_dashboard:{$outletId}:{$today->toDateString()}",
            [60, 300],
            fn () => $this->buildDashboard($outletId, $today),
        );

        return Inertia::render('owner/Dashboard', $dashboard);
    }

    protected function buildDashboard(?int $outletId, $today): array
    {
        $sales = $this->salesMetrics($today);
        $rounding = $this->roundingMetrics($today);
        $staff = $this->staffMetrics($outletId, $today);

        return [
            'avgCookingTime' => $sales['avgCookingTime'],
            'todaySales' => $sales['todaySales'],
            'todayOrdersCount' => $sales['todayOrdersCount'],
            'yesterdaySales' => $sales['yesterdaySales'],
            'thisWeekSales' => $sales['thisWeekSales'],
            'lastWeekSales' => $sales['lastWeekSales'],
            'salesGrowth' => $sales['yesterdaySales'] > 0 ? round(($sales['todaySales'] - $sales['yesterdaySales']) / $sales['yesterdaySales'] * 100, 1) : 0,
            'grossProfit' => $sales['todaySales'] * 0.6,
            'laborCost' => $sales['todaySales'] * 0.25,
            'monthlyRounding' => $rounding['monthlyRounding'],
            'lastMonthRounding' => $rounding['lastMonthRounding'],
            'roundingGrowth' => $rounding['lastMonthRounding'] > 0 ? round(($rounding['monthlyRounding'] - $rounding['lastMonthRounding']) / $rounding['lastMonthRounding'] * 100, 1) : 0,
            'employeeCount' => $staff['employeeCount'],
            'attendanceToday' => $staff['attendanceToday'],
            'activeOrders' => $this->activeOrders(),
            'topMenus' => $this->topMenus($today),
            'paymentSummary' => $this->paymentBreakdown($today),
            'salesTrend' => $this->salesTrend(),
        ];
    }

    protected function salesMetrics($today): array
    {
        $paidStatuses = [OrderStatus::Paid, OrderStatus::Completed];

        return [
            'todaySales' => $this->paidOn($paidStatuses, $today),
            'todayOrdersCount' => Order::whereIn('status', $paidStatuses)
                ->where('created_at', '>=', $today->startOfDay())
                ->where('created_at', '<', $today->copy()->addDay()->startOfDay())
                ->count(),
            'yesterdaySales' => $this->paidOn($paidStatuses, $today->copy()->subDay()),
            'thisWeekSales' => $this->paidSince($paidStatuses, $today->copy()->startOfWeek()),
            'lastWeekSales' => $this->paidBetween($paidStatuses, $today->copy()->subWeek()->startOfWeek(), $today->copy()->startOfWeek()),
            'avgCookingTime' => $this->avgCookingTime(),
        ];
    }

    protected function paidOn(array $statuses, $date): float
    {
        return $this->sumRange($statuses, $date, $date);
    }

    protected function paidSince(array $statuses, $from): float
    {
        return (float) Order::whereIn('status', $statuses)
            ->where('created_at', '>=', $from->startOfDay())
            ->sum('total');
    }

    protected function paidBetween(array $statuses, $from, $to): float
    {
        return (float) Order::whereIn('status', $statuses)
            ->where('created_at', '>=', $from->startOfDay())
            ->where('created_at', '<', $to->startOfDay())
            ->sum('total');
    }

    protected function sumRange(array $statuses, $from, $to): float
    {
        return (float) Order::whereIn('status', $statuses)
            ->where('created_at', '>=', $from->startOfDay())
            ->where('created_at', '<', $to->copy()->addDay()->startOfDay())
            ->sum('total');
    }

    protected function roundingMetrics($today): array
    {
        $paidStatuses = [OrderStatus::Paid, OrderStatus::Completed];
        $lastMonthStart = $today->copy()->subMonthNoOverflow()->startOfMonth();

        return [
            'monthlyRounding' => (float) Order::whereIn('status', $paidStatuses)
                ->whereBetween('created_at', [
                    $today->copy()->startOfMonth(),
                    $today->copy()->endOfMonth(),
                ])
                ->sum('rounding_amount'),
            'lastMonthRounding' => (float) Order::whereIn('status', $paidStatuses)
                ->whereBetween('created_at', [
                    $lastMonthStart->copy()->startOfMonth(),
                    $lastMonthStart->copy()->endOfMonth(),
                ])
                ->sum('rounding_amount'),
        ];
    }

    protected function staffMetrics(?int $outletId, $today): array
    {
        return [
            'employeeCount' => Employee::where('outlet_id', $outletId)->count(),
            'attendanceToday' => Attendance::where('clock_in_at', '>=', $today->startOfDay())
                ->where('clock_in_at', '<', $today->copy()->addDay()->startOfDay())
                ->count(),
        ];
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }

    protected function activeOrders(): array
    {
        return Order::whereIn('status', [OrderStatus::Paid, OrderStatus::Processing])
            ->when($this->outletId(), fn ($q, $outletId) => $q->forOutlet($outletId))
            ->with('tableSession.table')
            ->withCount('items')
            ->latest('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'table_code' => $o->tableSession?->table?->code ?? '-',
                'status' => $o->status,
                'items_count' => $o->items_count,
                'created_at' => $o->created_at->format('H:i'),
            ])
            ->all();
    }

    protected function topMenus($today): Collection
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->whereIn('orders.status', [OrderStatus::Paid, OrderStatus::Completed])
            ->whereBetween('orders.created_at', [$today->startOfDay(), $today->copy()->endOfDay()])
            ->select('menus.name', DB::raw('SUM(order_items.qty) as total_qty'))
            ->groupBy('menus.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();
    }

    protected function avgCookingTime(): ?float
    {
        $driver = DB::getDriverName();
        $expression = match ($driver) {
            'mysql' => 'AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at))',
            'pgsql' => 'AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60)',
            default => 'AVG((julianday(updated_at) - julianday(created_at)) * 1440)',
        };

        $avg = Order::whereIn('status', [OrderStatus::Ready, OrderStatus::Completed])
            ->whereNotNull('updated_at')
            ->selectRaw("{$expression} as avg_min")
            ->value('avg_min');

        return $avg !== null ? round((float) $avg) : null;
    }

    protected function paymentBreakdown($today): array
    {
        return Payment::where('created_at', '>=', $today->startOfDay())
            ->where('created_at', '<', $today->copy()->addDay()->startOfDay())
            ->select('method', DB::raw('COUNT(*) as count'), DB::raw('SUM(gross_amount) as total'))
            ->groupBy('method')
            ->get()
            ->toArray();
    }

    protected function salesTrend(): array
    {
        $start = today()->subDays(6)->startOfDay();
        $totals = Order::whereIn('status', [OrderStatus::Paid, OrderStatus::Completed])
            ->where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as d, SUM(total) as total')
            ->groupBy('d')
            ->pluck('total', 'd')
            ->map(fn ($v) => (float) $v);

        return collect(range(6, 0))->map(fn ($daysAgo) => [
            'date' => today()->subDays($daysAgo)->format('D'),
            'total' => $totals[today()->subDays($daysAgo)->toDateString()] ?? 0.0,
        ])->all();
    }
}

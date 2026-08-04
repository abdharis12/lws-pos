<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OwnerDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $outlet = Outlet::first();
        $today = today();

        return Inertia::render('owner/Dashboard', $this->buildDashboard($outlet, $today));
    }

    protected function buildDashboard(?Outlet $outlet, $today): array
    {
        $sales = $this->salesMetrics($today);
        $rounding = $this->roundingMetrics($today);
        $staff = $this->staffMetrics($outlet, $today);

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
            'todayOrdersCount' => Order::whereIn('status', $paidStatuses)->whereDate('created_at', $today)->count(),
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
        return (float) Order::whereIn('status', $statuses)->whereDate('created_at', '>=', $from)->sum('total');
    }

    protected function paidBetween(array $statuses, $from, $to): float
    {
        return (float) Order::whereIn('status', $statuses)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<', $to)
            ->sum('total');
    }

    protected function sumRange(array $statuses, $from, $to): float
    {
        return (float) Order::whereIn('status', $statuses)
            ->whereDate('created_at', '>=', $from)
            ->whereDate('created_at', '<=', $to)
            ->sum('total');
    }

    protected function roundingMetrics($today): array
    {
        $paidStatuses = [OrderStatus::Paid, OrderStatus::Completed];
        $lastMonthStart = $today->copy()->subMonthNoOverflow()->startOfMonth();

        return [
            'monthlyRounding' => (float) Order::whereIn('status', $paidStatuses)
                ->whereYear('created_at', $today->year)
                ->whereMonth('created_at', $today->month)
                ->sum('rounding_amount'),
            'lastMonthRounding' => (float) Order::whereIn('status', $paidStatuses)
                ->whereYear('created_at', $lastMonthStart->year)
                ->whereMonth('created_at', $lastMonthStart->month)
                ->sum('rounding_amount'),
        ];
    }

    protected function staffMetrics(?Outlet $outlet, $today): array
    {
        return [
            'employeeCount' => Employee::where('outlet_id', $outlet?->id)->count(),
            'attendanceToday' => Attendance::whereDate('clock_in_at', $today)->count(),
        ];
    }

    protected function activeOrders(): array
    {
        return Order::whereIn('status', [OrderStatus::Paid, OrderStatus::Processing])
            ->with('tableSession.table')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'table_code' => $o->tableSession?->table?->code ?? '-',
                'status' => $o->status,
                'items_count' => $o->items()->count(),
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
            ->whereDate('orders.created_at', $today)
            ->select('menus.name', DB::raw('SUM(order_items.qty) as total_qty'))
            ->groupBy('menus.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();
    }

    protected function avgCookingTime(): ?float
    {
        $avg = Order::whereIn('status', [OrderStatus::Ready, OrderStatus::Completed])
            ->whereNotNull('updated_at')
            ->get(['created_at', 'updated_at'])
            ->avg(fn (Order $o) => $o->created_at->diffInMinutes($o->updated_at));

        return $avg ? round((float) $avg) : null;
    }

    protected function paymentBreakdown($today): array
    {
        return Payment::whereDate('created_at', $today)
            ->select('method', DB::raw('COUNT(*) as count'), DB::raw('SUM(gross_amount) as total'))
            ->groupBy('method')
            ->get()
            ->toArray();
    }

    protected function salesTrend(): array
    {
        return collect(range(6, 0))->map(function ($daysAgo) {
            $date = today()->subDays($daysAgo);
            $total = (float) Order::whereIn('status', [OrderStatus::Paid, OrderStatus::Completed])
                ->whereDate('created_at', $date)
                ->sum('total');

            return ['date' => $date->format('D'), 'total' => $total];
        })->all();
    }
}

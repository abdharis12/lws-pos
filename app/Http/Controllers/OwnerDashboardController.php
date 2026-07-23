<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OwnerDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $outlet = Outlet::first();
        $today = today();
        $comparePeriod = $request->input('compare', 'previous'); // previous, same

        $todaySales = (float) Order::whereIn('status', ['paid', 'completed', 'settled'])
            ->whereDate('created_at', $today)
            ->sum('total');

        $todayOrdersCount = Order::whereIn('status', ['paid', 'completed', 'settled'])
            ->whereDate('created_at', $today)
            ->count();

        $yesterdaySales = (float) Order::whereIn('status', ['paid', 'completed', 'settled'])
            ->whereDate('created_at', $today->copy()->subDay())
            ->sum('total');

        $thisWeekSales = (float) Order::whereIn('status', ['paid', 'completed', 'settled'])
            ->whereDate('created_at', '>=', $today->copy()->startOfWeek())
            ->sum('total');

        $lastWeekSales = (float) Order::whereIn('status', ['paid', 'completed', 'settled'])
            ->whereDate('created_at', '>=', $today->copy()->subWeek()->startOfWeek())
            ->whereDate('created_at', '<', $today->copy()->startOfWeek())
            ->sum('total');

        $grossProfit = $todaySales * 0.6;

        $employeeCount = Employee::where('outlet_id', $outlet?->id)->count();
        $attendanceToday = Attendance::whereDate('clock_in_at', $today)->count();

        $activeOrders = Order::whereIn('status', ['paid', 'in_progress', 'preparing'])
            ->with('tableSession.table')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'table_code' => $o->tableSession?->table?->table_number ?? '-',
                'status' => $o->status,
                'items_count' => $o->items()->count(),
                'created_at' => $o->created_at->format('H:i'),
            ]);

        $topMenus = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->whereIn('orders.status', ['paid', 'completed', 'settled'])
            ->whereDate('orders.created_at', $today)
            ->select('menus.name', DB::raw('SUM(order_items.qty) as total_qty'))
            ->groupBy('menus.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        $paymentSummary = Payment::whereDate('created_at', $today)
            ->select('method', DB::raw('COUNT(*) as count'), DB::raw('SUM(gross_amount) as total'))
            ->groupBy('method')
            ->get();

        $salesTrend = collect(range(6, 0))->map(function ($daysAgo) {
            $date = today()->subDays($daysAgo);
            $total = (float) Order::whereIn('status', ['paid', 'completed', 'settled'])
                ->whereDate('created_at', $date)
                ->sum('total');

            return [
                'date' => $date->format('D'),
                'total' => $total,
            ];
        });

        return Inertia::render('owner/Dashboard', [
            'todaySales' => $todaySales,
            'todayOrdersCount' => $todayOrdersCount,
            'yesterdaySales' => $yesterdaySales,
            'thisWeekSales' => $thisWeekSales,
            'lastWeekSales' => $lastWeekSales,
            'salesGrowth' => $yesterdaySales > 0 ? round(($todaySales - $yesterdaySales) / $yesterdaySales * 100, 1) : 0,
            'grossProfit' => $grossProfit,
            'laborCost' => $todaySales * 0.25,
            'employeeCount' => $employeeCount,
            'attendanceToday' => $attendanceToday,
            'activeOrders' => $activeOrders,
            'topMenus' => $topMenus,
            'paymentSummary' => $paymentSummary,
            'salesTrend' => $salesTrend,
        ]);
    }
}

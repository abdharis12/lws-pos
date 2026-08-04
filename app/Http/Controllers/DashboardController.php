<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Outlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = today();
        $outlet = Outlet::first();

        $paidStatuses = [OrderStatus::Paid->value, OrderStatus::Completed->value];

        $todaySales = (float) Order::whereIn('status', $paidStatuses)
            ->whereDate('created_at', $today)
            ->sum('total');

        $todayOrdersCount = Order::whereIn('status', $paidStatuses)
            ->whereDate('created_at', $today)
            ->count();

        $topMenus = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->whereIn('orders.status', $paidStatuses)
            ->whereDate('orders.created_at', $today)
            ->select(
                'menus.id',
                'menus.name',
                DB::raw('SUM(order_items.qty) as total_qty'),
                DB::raw('SUM(order_items.total_price) as total_revenue'),
            )
            ->groupBy('menus.id', 'menus.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'total_qty' => (int) $row->total_qty,
                'total_revenue' => (float) $row->total_revenue,
            ])
            ->all();

        $activeOrders = Order::whereIn('status', [
            OrderStatus::Paid->value,
            OrderStatus::Processing->value,
            OrderStatus::Ready->value,
        ])
            ->with(['tableSession.table', 'items'])
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn (Order $o) => [
                'id' => $o->id,
                'table_code' => $o->tableSession?->table?->code ?? '-',
                'status' => $o->status->value,
                'items_count' => $o->items->count(),
                'created_at' => $o->created_at->format('H:i'),
            ])
            ->all();

        $todayAttendances = Employee::query()
            ->where('outlet_id', $outlet?->id)
            ->with(['user', 'attendances' => fn ($q) => $q->whereDate('clock_in_at', $today)])
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => $employee->user?->name ?? '-',
                'position' => $employee->position ?? '-',
                'clock_in' => $employee->attendances->first()?->clock_in_at?->format('H:i') ?? null,
                'status' => $employee->attendances->first()?->status ?? 'absent',
            ])
            ->all();

        return Inertia::render('dashboard', [
            'todaySales' => $todaySales,
            'todayOrdersCount' => $todayOrdersCount,
            'topMenus' => $topMenus,
            'activeOrders' => $activeOrders,
            'todayAttendances' => $todayAttendances,
        ]);
    }
}

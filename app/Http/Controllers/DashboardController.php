<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Employee;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = today();
        $outletId = $this->outletId();

        $dashboard = Cache::flexible(
            "dashboard:today:{$outletId}:{$today->toDateString()}",
            [60, 300],
            fn () => $this->buildDashboard($today, $outletId),
        );

        return Inertia::render('dashboard', $dashboard);
    }

    protected function buildDashboard($today, ?int $outletId): array
    {
        $paidStatuses = [OrderStatus::Paid->value, OrderStatus::Completed->value];
        $nextDay = $today->addDay();

        $todayStats = Order::whereIn('status', $paidStatuses)
            ->where('created_at', '>=', $today)
            ->where('created_at', '<', $nextDay)
            ->forOutlet($outletId)
            ->selectRaw('COALESCE(SUM(total),0) as sales, COUNT(*) as cnt')
            ->first();

        $topMenus = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->whereIn('orders.status', $paidStatuses)
            ->whereBetween('orders.created_at', [$today, $nextDay])
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
            ->forOutlet($outletId)
            ->with('tableSession.table')
            ->withCount('items')
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(fn (Order $o) => [
                'id' => $o->id,
                'table_code' => $o->tableSession?->table?->code ?? '-',
                'status' => $o->status->value,
                'items_count' => $o->items_count,
                'created_at' => $o->created_at->format('H:i'),
            ])
            ->all();

        $todayAttendances = Employee::query()
            ->where('outlet_id', $outletId)
            ->with(['user', 'attendances' => fn ($q) => $q
                ->where('clock_in_at', '>=', $today)
                ->where('clock_in_at', '<', $nextDay),
            ])
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => $employee->user?->name ?? '-',
                'position' => $employee->position ?? '-',
                'clock_in' => $employee->attendances->first()?->clock_in_at?->format('H:i') ?? null,
                'status' => $employee->attendances->first()?->status ?? 'absent',
            ])
            ->all();

        return [
            'todaySales' => (float) $todayStats->sales,
            'todayOrdersCount' => (int) $todayStats->cnt,
            'topMenus' => $topMenus,
            'activeOrders' => $activeOrders,
            'todayAttendances' => $todayAttendances,
        ];
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }
}

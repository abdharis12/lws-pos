<?php

namespace App\Http\Controllers;

use App\Exports\SalesReportExport;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $outlet = Outlet::first();
        $period = $request->input('period', 'daily');
        $date = $request->input('date', today()->format('Y-m-d'));
        $weekStart = $request->input('week_start', now()->startOfWeek()->format('Y-m-d'));
        $month = $request->input('month', today()->format('Y-m'));

        $salesQuery = Order::whereIn('orders.status', ['paid', 'completed', 'settled']);

        switch ($period) {
            case 'weekly':
                $weekEnd = date('Y-m-d', strtotime($weekStart.' +6 days'));
                $salesQuery->whereDate('orders.created_at', '>=', $weekStart)
                    ->whereDate('orders.created_at', '<=', $weekEnd);
                break;
            case 'monthly':
                $salesQuery->whereYear('orders.created_at', substr($month, 0, 4))
                    ->whereMonth('orders.created_at', substr($month, 5, 2));
                break;
            default:
                $salesQuery->whereDate('orders.created_at', $date);
                break;
        }

        $totalSales = (float) (clone $salesQuery)->sum('orders.total');
        $totalOrders = (clone $salesQuery)->count('orders.id');
        $averageOrder = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        $paymentBreakdown = (clone $salesQuery)
            ->join('payments', 'orders.id', '=', 'payments.order_id')
            ->select('payments.method', DB::raw('COUNT(*) as count'), DB::raw('SUM(payments.gross_amount) as total'))
            ->groupBy('payments.method')
            ->get();

        $hourlyOrders = Order::whereIn('status', ['paid', 'completed', 'settled'])
            ->whereDate('created_at', $date)
            ->select('id', 'total', 'created_at')
            ->get();

        $hourlyData = collect(range(0, 23))->map(function ($hour) use ($hourlyOrders) {
            $orders = $hourlyOrders->filter(fn ($o) => (int) $o->created_at->format('H') === $hour);

            return [
                'hour' => sprintf('%02d:00', $hour),
                'count' => $orders->count(),
                'total' => (float) $orders->sum('total'),
            ];
        });

        $topMenus = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->whereIn('orders.status', ['paid', 'completed', 'settled'])
            ->whereDate('orders.created_at', $date)
            ->select('menus.id', 'menus.name', DB::raw('SUM(order_items.qty) as total_qty'), DB::raw('SUM(order_items.total_price) as total_revenue'))
            ->groupBy('menus.id', 'menus.name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();

        return Inertia::render('admin/reports/Index', [
            'period' => $period,
            'date' => $date,
            'weekStart' => $weekStart,
            'month' => $month,
            'totalSales' => $totalSales,
            'totalOrders' => $totalOrders,
            'averageOrder' => $averageOrder,
            'paymentBreakdown' => $paymentBreakdown,
            'hourlyData' => $hourlyData,
            'topMenus' => $topMenus,
        ]);
    }

    public function topMenus(Request $request): Response
    {
        $outlet = Outlet::first();
        $startDate = $request->input('start_date', today()->subMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', today()->format('Y-m-d'));

        $menus = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->leftJoin('order_item_options', 'order_item_options.order_item_id', '=', 'order_items.id')
            ->leftJoin('option_items', 'option_items.id', '=', 'order_item_options.option_item_id')
            ->whereIn('orders.status', ['paid', 'completed', 'settled'])
            ->whereDate('orders.created_at', '>=', $startDate)
            ->whereDate('orders.created_at', '<=', $endDate)
            ->select(
                'menus.id',
                'menus.name',
                DB::raw('SUM(order_items.qty) as total_qty'),
                DB::raw('SUM(order_items.total_price) as total_revenue')
            )
            ->groupBy('menus.id', 'menus.name')
            ->orderByDesc('total_qty')
            ->limit(20)
            ->get();

        $topOptionItems = DB::table('order_item_options')
            ->join('order_items', 'order_items.id', '=', 'order_item_options.order_item_id')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('option_items', 'option_items.id', '=', 'order_item_options.option_item_id')
            ->join('option_groups', 'option_groups.id', '=', 'option_items.option_group_id')
            ->whereIn('orders.status', ['paid', 'completed', 'settled'])
            ->whereDate('orders.created_at', '>=', $startDate)
            ->whereDate('orders.created_at', '<=', $endDate)
            ->select(
                'option_items.id',
                'option_items.name',
                'option_groups.name as group_name',
                DB::raw('COUNT(*) as total_used'),
                DB::raw('SUM(order_item_options.price_adjustment) as total_adjustment')
            )
            ->groupBy('option_items.id', 'option_items.name', 'option_groups.name')
            ->orderByDesc('total_used')
            ->limit(10)
            ->get();

        return Inertia::render('admin/reports/TopMenus', [
            'menus' => $menus,
            'topOptionItems' => $topOptionItems,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    public function reconciliation(Request $request): Response
    {
        $outlet = Outlet::first();
        $startDate = $request->input('start_date', today()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', today()->format('Y-m-d'));

        $payments = Payment::with('order')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->orderByDesc('created_at')
            ->get();

        $summary = [
            'total_system' => (float) $payments->where('status', 'settlement')->sum('gross_amount'),
            'total_pending' => (float) $payments->where('status', 'pending')->sum('gross_amount'),
            'total_failed' => (float) $payments->whereIn('status', ['expire', 'cancel', 'deny', 'failure'])->sum('gross_amount'),
            'qris_count' => $payments->where('method', 'qris')->count(),
            'cash_count' => $payments->where('method', 'cash')->count(),
            'debit_count' => $payments->where('method', 'debit')->count(),
        ];

        return Inertia::render('admin/reports/Reconciliation', [
            'payments' => $payments,
            'summary' => $summary,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    public function attendance(Request $request): Response
    {
        $outlet = Outlet::first();
        $month = $request->input('month', today()->format('Y-m'));
        $year = (int) substr($month, 0, 4);
        $monthNum = (int) substr($month, 5, 2);

        $employees = Employee::with('user')
            ->where('outlet_id', $outlet?->id)
            ->with(['attendances' => function ($q) use ($year, $monthNum) {
                $q->whereYear('clock_in_at', $year)
                    ->whereMonth('clock_in_at', $monthNum);
            }])
            ->get();

        $summary = $employees->map(function ($employee) {
            $attendances = $employee->attendances;
            $totalDays = $attendances->count();
            $lateDays = $attendances->where('status', 'late')->count();
            $totalHours = $attendances->sum(function ($a) {
                if ($a->clock_in_at && $a->clock_out_at) {
                    return $a->clock_in_at->diffInHours($a->clock_out_at);
                }

                return 0;
            });

            return [
                'employee_id' => $employee->id,
                'name' => $employee->user?->name ?? 'Unknown',
                'position' => $employee->position,
                'total_days' => $totalDays,
                'late_days' => $lateDays,
                'total_hours' => $totalHours,
            ];
        });

        return Inertia::render('admin/reports/Attendance', [
            'summary' => $summary,
            'month' => $month,
        ]);
    }

    public function overtime(Request $request): Response
    {
        $outlet = Outlet::first();
        $month = $request->input('month', today()->format('Y-m'));
        $year = (int) substr($month, 0, 4);
        $monthNum = (int) substr($month, 5, 2);

        $employees = Employee::with('user')
            ->where('outlet_id', $outlet?->id)
            ->with(['shifts' => function ($q) use ($year, $monthNum) {
                $q->whereYear('shift_date', $year)
                    ->whereMonth('shift_date', $monthNum);
            }, 'attendances' => function ($q) use ($year, $monthNum) {
                $q->whereYear('clock_in_at', $year)
                    ->whereMonth('clock_in_at', $monthNum);
            }])
            ->get();

        $summary = $employees->map(function ($employee) {
            $totalOvertimeHours = 0;
            $totalOvertimeDays = 0;

            foreach ($employee->attendances as $attendance) {
                if (! $attendance->clock_in_at || ! $attendance->clock_out_at) {
                    continue;
                }

                $shift = $employee->shifts->firstWhere('shift_date', $attendance->clock_in_at->format('Y-m-d'));
                if (! $shift) {
                    continue;
                }

                $scheduledEnd = Carbon::parse($attendance->clock_in_at->format('Y-m-d').' '.$shift->end_time);
                $actualEnd = $attendance->clock_out_at;

                if ($actualEnd->gt($scheduledEnd)) {
                    $overtimeHours = $actualEnd->diffInHours($scheduledEnd);
                    if ($overtimeHours > 0) {
                        $totalOvertimeHours += $overtimeHours;
                        $totalOvertimeDays++;
                    }
                }
            }

            return [
                'employee_id' => $employee->id,
                'name' => $employee->user?->name ?? 'Unknown',
                'position' => $employee->position,
                'total_attendance_days' => $employee->attendances->count(),
                'total_overtime_days' => $totalOvertimeDays,
                'total_overtime_hours' => round($totalOvertimeHours, 1),
            ];
        })->filter(fn ($item) => $item['total_overtime_days'] > 0)->values();

        return Inertia::render('admin/reports/Overtime', [
            'summary' => $summary,
            'month' => $month,
        ]);
    }

    public function exportSales(Request $request): BinaryFileResponse
    {
        $period = $request->input('period', 'daily');
        $date = $request->input('date', today()->format('Y-m-d'));
        $format = $request->input('format', 'xlsx');

        $fileName = 'laporan-penjualan-'.$date.'.'.$format;

        return Excel::download(new SalesReportExport($period, $date), $fileName);
    }
}

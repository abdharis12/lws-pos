<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Exports\SalesReportExport;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);

        $period = $request->input('period', 'daily');
        $date = $request->input('date', today()->format('Y-m-d'));
        $weekStart = $request->input('week_start', now()->startOfWeek()->format('Y-m-d'));
        $month = $request->input('month', today()->format('Y-m'));

        $salesQuery = $this->buildSalesQuery($period, $date, $weekStart, $month);
        $totalSales = $this->totalSales($salesQuery);
        $totalOrders = (clone $salesQuery)->count('orders.id');
        $averageOrder = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        return Inertia::render('admin/reports/Index', [
            'period' => $period,
            'date' => $date,
            'weekStart' => $weekStart,
            'month' => $month,
            'totalSales' => $totalSales,
            'totalOrders' => $totalOrders,
            'averageOrder' => $averageOrder,
            'paymentBreakdown' => $this->paymentBreakdown($salesQuery),
            'hourlyData' => $this->hourlyData($date),
            'topMenus' => $this->topMenusForDate($date),
        ]);
    }

    public function topMenus(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);

        $startDate = $request->input('start_date', today()->subMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', today()->format('Y-m-d'));

        return Inertia::render('admin/reports/TopMenus', [
            'menus' => $this->topSellingMenus($startDate, $endDate),
            'topOptionItems' => $this->topOptionItems($startDate, $endDate),
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    public function reconciliation(Request $request): Response
    {
        $this->authorize('viewAny', Payment::class);

        $startDate = $request->input('start_date', today()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', today()->format('Y-m-d'));

        $payments = Payment::with('order')
            ->select('id', 'order_id', 'method', 'gross_amount', 'status', 'created_at')
            ->where('created_at', '>=', Carbon::parse($startDate)->startOfDay())
            ->where('created_at', '<=', Carbon::parse($endDate)->endOfDay())
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('admin/reports/Reconciliation', [
            'payments' => $payments,
            'summary' => $this->reconciliationSummarySql($startDate, $endDate),
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    public function attendance(Request $request): Response
    {
        $this->authorize('viewAny', Attendance::class);

        [$year, $monthNum, $month, $monthStart, $monthEnd] = $this->monthRange($request);
        $employees = $this->activeEmployees($request);
        $employeeIds = $employees->pluck('id');

        $attendances = Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('clock_in_at', [Carbon::parse($monthStart)->startOfDay(), Carbon::parse($monthEnd)->endOfDay()])
            ->get()
            ->groupBy('employee_id');

        $shifts = Shift::whereIn('employee_id', $employeeIds)
            ->whereBetween('shift_date', [$monthStart, $monthEnd])
            ->get()
            ->groupBy('employee_id');

        $summary = $this->attendanceSummary($employees, $attendances, $shifts);

        return Inertia::render('admin/reports/Attendance', [
            'summary' => $summary,
            'month' => $month,
            'monthLabel' => Carbon::create((int) substr($month, 0, 4), (int) substr($month, 5, 2), 1)->locale('id')->translatedFormat('F Y'),
            'grandTotal' => $this->grandTotal($summary),
        ]);
    }

    public function overtime(Request $request): Response
    {
        $this->authorize('viewAny', Attendance::class);

        [$year, $monthNum, $month] = $this->yearMonth($request);
        $monthStart = Carbon::create($year, $monthNum, 1);
        $monthEnd = $monthStart->copy()->endOfMonth();

        $employees = Employee::with('user')
            ->where('outlet_id', $this->outletId())
            ->with([
                'shifts' => fn ($q) => $q->whereBetween('shift_date', [$monthStart, $monthEnd]),
                'attendances' => fn ($q) => $q->whereBetween('clock_in_at', [$monthStart, $monthEnd]),
            ])
            ->get();

        $summary = $employees->map(fn ($employee) => $this->overtimeRow($employee))
            ->filter(fn ($item) => $item['total_overtime_days'] > 0)
            ->values();

        return Inertia::render('admin/reports/Overtime', [
            'summary' => $summary,
            'month' => $month,
        ]);
    }

    public function waiterPoints(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);
        [$year, $monthNum, $month] = $this->yearMonth($request);
        $monthStart = Carbon::create($year, $monthNum, 1);
        $monthEnd = $monthStart->copy()->endOfMonth();

        $points = Order::where('status', OrderStatus::Completed)
            ->whereNotNull('served_by')
            ->whereBetween('served_at', [$monthStart, $monthEnd])
            ->selectRaw('served_by, COUNT(*) as total')
            ->groupBy('served_by')
            ->pluck('total', 'served_by')
            ->map(fn ($total) => (int) $total);

        $servedUserIds = $points->keys();

        $waiters = $this->waiterWithActivity($servedUserIds);
        $summary = $this->waiterSummary($waiters, $points);

        return Inertia::render('admin/reports/WaiterPoints', [
            'summary' => $summary,
            'month' => $month,
            'monthLabel' => $monthStart->locale('id')->translatedFormat('F Y'),
            'totalWaiters' => $summary->count(),
            'totalPoints' => $summary->sum('points'),
            'topWaiter' => $summary->first()['name'] ?? '—',
            'maxPoints' => $summary->first()['points'] ?? 0,
        ]);
    }

    public function exportSales(Request $request): BinaryFileResponse
    {
        $this->authorize('viewAny', Order::class);

        $period = $request->input('period', 'daily');
        $date = $request->input('date', today()->format('Y-m-d'));
        $format = $request->input('format', 'xlsx');

        return Excel::download(new SalesReportExport($period, $date), 'laporan-penjualan-'.$date.'.'.$format);
    }

    // ── Sales helpers ───────────────────────────────────────────────────────

    protected function buildSalesQuery(string $period, string $date, string $weekStart, string $month): Builder
    {
        $query = Order::whereIn('orders.status', [OrderStatus::Paid, OrderStatus::Completed]);

        return match ($period) {
            'weekly' => $query->where('orders.created_at', '>=', Carbon::parse($weekStart)->startOfDay())
                ->where('orders.created_at', '<=', Carbon::parse($weekStart)->addDays(6)->endOfDay()),
            'monthly' => $query->whereBetween('orders.created_at', [
                Carbon::createFromFormat('Y-m', $month)->startOfMonth(),
                Carbon::createFromFormat('Y-m', $month)->endOfMonth(),
            ]),
            default => $query->whereBetween('orders.created_at', [
                Carbon::parse($date)->startOfDay(),
                Carbon::parse($date)->endOfDay(),
            ]),
        };
    }

    protected function totalSales(Builder $query): float
    {
        return (float) (clone $query)->sum('orders.total');
    }

    protected function paymentBreakdown(Builder $query): Collection
    {
        return (clone $query)
            ->join('payments', 'orders.id', '=', 'payments.order_id')
            ->select('payments.method', DB::raw('COUNT(*) as count'), DB::raw('SUM(payments.gross_amount) as total'))
            ->groupBy('payments.method')
            ->get();
    }

    protected function hourlyData(string $date): Collection
    {
        $start = Carbon::parse($date)->startOfDay();

        $rows = Order::whereIn('status', [OrderStatus::Paid, OrderStatus::Completed])
            ->where('created_at', '>=', $start)
            ->where('created_at', '<', $start->copy()->addDay())
            ->selectRaw('EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) as count, COALESCE(SUM(total),0) as total')
            ->groupBy('hour')
            ->get()
            ->keyBy('hour');

        return collect(range(0, 23))->map(function ($hour) use ($rows) {
            $row = $rows->get($hour);

            return [
                'hour' => sprintf('%02d:00', $hour),
                'count' => (int) ($row->count ?? 0),
                'total' => (float) ($row->total ?? 0),
            ];
        });
    }

    protected function topMenusForDate(string $date): Collection
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->whereIn('orders.status', [OrderStatus::Paid, OrderStatus::Completed])
            ->whereBetween('orders.created_at', [
                Carbon::parse($date)->startOfDay(),
                Carbon::parse($date)->endOfDay(),
            ])
            ->select('menus.id', 'menus.name', DB::raw('SUM(order_items.qty) as total_qty'), DB::raw('SUM(order_items.total_price) as total_revenue'))
            ->groupBy('menus.id', 'menus.name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get();
    }

    protected function topSellingMenus(string $startDate, string $endDate): Collection
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menus', 'menus.id', '=', 'order_items.menu_id')
            ->whereIn('orders.status', [OrderStatus::Paid, OrderStatus::Completed])
            ->whereBetween('orders.created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ])
            ->select('menus.id', 'menus.name', DB::raw('SUM(order_items.qty) as total_qty'), DB::raw('SUM(order_items.total_price) as total_revenue'))
            ->groupBy('menus.id', 'menus.name')
            ->orderByDesc('total_qty')
            ->limit(20)
            ->get();
    }

    protected function topOptionItems(string $startDate, string $endDate): Collection
    {
        return DB::table('order_item_options')
            ->join('order_items', 'order_items.id', '=', 'order_item_options.order_item_id')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('option_items', 'option_items.id', '=', 'order_item_options.option_item_id')
            ->join('option_groups', 'option_groups.id', '=', 'option_items.option_group_id')
            ->whereIn('orders.status', [OrderStatus::Paid, OrderStatus::Completed])
            ->whereBetween('orders.created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ])
            ->select('option_items.id', 'option_items.name', 'option_groups.name as group_name', DB::raw('COUNT(*) as total_used'), DB::raw('SUM(order_item_options.price_adjustment) as total_adjustment'))
            ->groupBy('option_items.id', 'option_items.name', 'option_groups.name')
            ->orderByDesc('total_used')
            ->limit(10)
            ->get();
    }

    protected function reconciliationSummarySql(string $startDate, string $endDate): array
    {
        $row = Payment::where('created_at', '>=', Carbon::parse($startDate)->startOfDay())
            ->where('created_at', '<=', Carbon::parse($endDate)->endOfDay())
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status IN ('settlement','success') THEN gross_amount ELSE 0 END),0) as total_system,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN gross_amount ELSE 0 END),0) as total_pending,
                COALESCE(SUM(CASE WHEN status IN ('failed','expire','cancel','deny','failure') THEN gross_amount ELSE 0 END),0) as total_failed,
                COALESCE(SUM(CASE WHEN method = 'qris' THEN 1 ELSE 0 END),0) as qris_count,
                COALESCE(SUM(CASE WHEN method = 'cash' THEN 1 ELSE 0 END),0) as cash_count,
                COALESCE(SUM(CASE WHEN method = 'debit' THEN 1 ELSE 0 END),0) as debit_count
            ")
            ->first();

        return [
            'total_system' => (float) $row->total_system,
            'total_pending' => (float) $row->total_pending,
            'total_failed' => (float) $row->total_failed,
            'qris_count' => (int) $row->qris_count,
            'cash_count' => (int) $row->cash_count,
            'debit_count' => (int) $row->debit_count,
        ];
    }

    // ── Attendance/overtime/waiters helpers ────────────────────────────────

    protected function monthRange(Request $request): array
    {
        $month = $request->input('month', today()->format('Y-m'));
        [$year, $monthNum] = $this->yearMonth($request);
        $monthStart = Carbon::create($year, $monthNum, 1)->format('Y-m-d');
        $monthEnd = Carbon::create($year, $monthNum, 1)->endOfMonth()->format('Y-m-d');

        return [$year, $monthNum, $month, $monthStart, $monthEnd];
    }

    protected function yearMonth(Request $request): array
    {
        $month = $request->input('month', today()->format('Y-m'));

        return [(int) substr($month, 0, 4), (int) substr($month, 5, 2), $month];
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }

    protected function activeEmployees(Request $request): Collection
    {
        return Employee::with('user')
            ->where('outlet_id', $this->outletId())
            ->where('is_active', true)
            ->get();
    }

    protected function attendanceSummary(Collection $employees, Collection $attendances, Collection $shifts): Collection
    {
        return $employees->map(function ($employee) use ($attendances, $shifts) {
            $empAttendances = $attendances->get($employee->id, collect());
            $empShifts = $shifts->get($employee->id, collect());
            $totalShiftDays = $empShifts->count();
            $hadir = $empAttendances->count();
            $terlambat = $empAttendances->where('status', 'late')->count();
            $pulangCepat = $empAttendances->where('early_leave', true)->count();
            $alfa = max(0, $totalShiftDays - $hadir);
            $persentase = $totalShiftDays > 0 ? round(($hadir / $totalShiftDays) * 100, 1) : 0;
            $totalHours = round($this->attendanceMinutes($empAttendances) / 60, 1);

            return [
                'employee_id' => $employee->id,
                'name' => $employee->user?->name ?? 'Unknown',
                'position' => $employee->position,
                'total_shift_days' => $totalShiftDays,
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'pulang_cepat' => $pulangCepat,
                'alfa' => $alfa,
                'total_jam' => $totalHours,
                'persentase' => $persentase,
                'attendances' => $this->attendanceRows($empAttendances),
            ];
        })->values();
    }

    protected function attendanceMinutes(Collection $attendances): int
    {
        return $attendances->sum(function ($a) {
            if ($a->clock_in_at && $a->clock_out_at) {
                return $a->clock_in_at->diffInMinutes($a->clock_out_at);
            }

            return 0;
        });
    }

    protected function attendanceRows(Collection $attendances): Collection
    {
        return $attendances->map(fn ($a) => [
            'date' => $a->clock_in_at->format('Y-m-d'),
            'clock_in' => $a->clock_in_at->format('H:i'),
            'clock_out' => $a->clock_out_at?->format('H:i'),
            'status' => $a->status,
            'early_leave' => $a->early_leave,
        ])->values();
    }

    protected function grandTotal(Collection $summary): array
    {
        return [
            'total_shift_days' => $summary->sum('total_shift_days'),
            'hadir' => $summary->sum('hadir'),
            'terlambat' => $summary->sum('terlambat'),
            'pulang_cepat' => $summary->sum('pulang_cepat'),
            'alfa' => $summary->sum('alfa'),
        ];
    }

    protected function overtimeRow(Employee $employee): array
    {
        [$totalOvertimeHours, $totalOvertimeDays] = $this->overtimeTotals($employee);

        return [
            'employee_id' => $employee->id,
            'name' => $employee->user?->name ?? 'Unknown',
            'position' => $employee->position,
            'total_attendance_days' => $employee->attendances->count(),
            'total_overtime_days' => $totalOvertimeDays,
            'total_overtime_hours' => round($totalOvertimeHours, 1),
        ];
    }

    protected function overtimeTotals(Employee $employee): array
    {
        return $employee->attendances->reduce(function (array $carry, $attendance) use ($employee) {
            if (! $attendance->clock_in_at || ! $attendance->clock_out_at) {
                return $carry;
            }

            $shift = $employee->shifts->firstWhere('shift_date', $attendance->clock_in_at->format('Y-m-d'));
            if (! $shift) {
                return $carry;
            }

            $scheduledEnd = Carbon::parse($attendance->clock_in_at->format('Y-m-d').' '.$shift->end_time);
            $overtimeHours = $attendance->clock_out_at->gt($scheduledEnd) ? $attendance->clock_out_at->diffInHours($scheduledEnd) : 0;

            if ($overtimeHours > 0) {
                $carry = [$carry[0] + $overtimeHours, $carry[1] + 1];
            }

            return $carry;
        }, [0, 0]);
    }

    protected function waiterWithActivity(Collection $servedUserIds): Collection
    {
        return Employee::with('user')
            ->where('outlet_id', $this->outletId())
            ->whereHas('user', fn ($q) => $q->role('Waiter'))
            ->where(function ($query) use ($servedUserIds) {
                $query->where('is_active', true)
                    ->orWhereIn('user_id', $servedUserIds);
            })
            ->get();
    }

    protected function waiterSummary(Collection $waiters, Collection $points): Collection
    {
        return $waiters
            ->map(fn ($employee) => [
                'employee_id' => $employee->id,
                'name' => $employee->user?->name ?? 'Unknown',
                'position' => $employee->position,
                'points' => $points->get($employee->user_id, 0),
            ])
            ->sortByDesc('points')
            ->values()
            ->map(fn ($row, $index) => [...$row, 'rank' => $index + 1]);
    }
}

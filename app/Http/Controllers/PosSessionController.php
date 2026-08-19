<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\PosSession;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosSessionController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeSession($request);

        $outletId = $this->outletId();
        $currentSession = $this->currentSession($outletId);
        $recentSessions = $this->recentSessions($outletId);

        $shiftSummaries = $currentSession
            ? $this->buildShiftSummaries($currentSession->orders, $this->todayShifts())
            : [];

        return Inertia::render('pos/Sessions', [
            'currentSession' => $currentSession,
            'recentSessions' => $recentSessions,
            'shiftSummaries' => $shiftSummaries,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['opening_balance' => 'required|numeric|min:0']);
        $this->authorizeSession($request);
        $outletId = $this->outletId();
        $outlet = Outlet::findOrFail($outletId);
        $this->assertNoOpenSession($outlet->id);

        $session = PosSession::create([
            'outlet_id' => $outlet->id,
            'session_date' => today(),
            'opening_balance' => $validated['opening_balance'],
            'opened_at' => now(),
            'status' => 'open',
            'opened_by' => $request->user()->id,
        ]);

        return response()->json($session->load('openedBy'), 201);
    }

    public function show(PosSession $posSession): JsonResponse
    {
        $posSession->load(['orders.payment', 'openedBy', 'closedBy']);

        return response()->json([
            'session' => $posSession,
            'shift_summaries' => $this->buildShiftSummaries($posSession->orders, $this->todayShifts()),
        ]);
    }

    public function close(Request $request, PosSession $posSession): JsonResponse
    {
        $this->authorizeSession($request);

        if ($posSession->status !== 'open') {
            abort(409, 'Session sudah ditutup.');
        }

        $posSession->load('orders.payment');
        $posSession->update([
            'closed_at' => now(),
            'closed_by' => $request->user()->id,
            'status' => 'closed',
            'total_cash' => $this->cashTotal($posSession->orders),
            'total_non_cash' => $this->nonCashTotal($posSession->orders),
            'total_transactions' => $posSession->orders->count(),
        ]);

        return response()->json($posSession);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    protected function authorizeSession(Request $request): void
    {
        if (! $request->user()->hasAnyRole(['Owner', 'Admin'])) {
            abort(403);
        }
    }

    protected function currentSession(?int $outletId): ?PosSession
    {
        return PosSession::with(['openedBy', 'closedBy', 'orders.payment'])
            ->where('outlet_id', $outletId)
            ->whereDate('session_date', today())
            ->where('status', 'open')
            ->first();
    }

    protected function recentSessions(?int $outletId): Collection
    {
        return PosSession::with(['openedBy', 'closedBy'])
            ->where('outlet_id', $outletId)
            ->where('session_date', '<=', today())
            ->orderByDesc('session_date')
            ->orderByDesc('created_at')
            ->take(20)
            ->get();
    }

    protected function todayShifts(): Collection
    {
        return Shift::with('employee.user')
            ->where('shift_date', today())
            ->whereHas('employee.user', fn ($q) => $q->role('Cashier'))
            ->get();
    }

    protected function buildShiftSummaries(Collection $sessionOrders, Collection $shiftsToday): array
    {
        $summaries = [];

        foreach ([1, 2] as $shiftNum) {
            $shift = $shiftsToday->firstWhere('shift_number', $shiftNum);
            $summaries[] = $this->summarizeShift($shiftNum, $shift, $sessionOrders);
        }

        return $summaries;
    }

    protected function summarizeShift(int $shiftNum, ?Shift $shift, Collection $sessionOrders): array
    {
        if (! $shift) {
            return ['shift_number' => $shiftNum, 'employee_name' => '-', 'start_time' => '-', 'end_time' => '-', 'total_transactions' => 0, 'total_cash' => 0, 'total_non_cash' => 0];
        }

        $shiftOrders = $sessionOrders->filter(fn ($order) => $this->belongsToShift($order, $shift, $shiftNum));

        return [
            'shift_number' => $shiftNum,
            'employee_name' => $shift->employee?->user?->name ?? '-',
            'start_time' => $shift->start_time,
            'end_time' => $shift->end_time,
            'total_transactions' => $shiftOrders->count(),
            'total_cash' => $this->cashTotal($shiftOrders),
            'total_non_cash' => $this->nonCashTotal($shiftOrders),
        ];
    }

    protected function belongsToShift($order, Shift $shift, int $shiftNum): bool
    {
        $orderTime = $order->created_at;
        $orderTimeOnly = Carbon::parse($orderTime->format('H:i'));
        $shiftStart = Carbon::parse($shift->start_time);
        $shiftEnd = Carbon::parse($shift->end_time);

        if ($shiftNum === 1) {
            return $orderTimeOnly->between($shiftStart, $shiftEnd) || $orderTimeOnly->lt($shiftStart);
        }

        return $orderTimeOnly->between($shiftStart, $shiftEnd);
    }

    protected function cashTotal(Collection $orders): float
    {
        return $orders->reduce(fn ($c, $o) => $c + ($o->payment?->method === 'cash' ? $o->total : 0), 0);
    }

    protected function nonCashTotal(Collection $orders): float
    {
        return $orders->reduce(fn ($c, $o) => $c + ($o->payment?->method !== 'cash' && $o->payment ? $o->total : 0), 0);
    }

    protected function assertNoOpenSession(int $outletId): void
    {
        $existing = PosSession::where('outlet_id', $outletId)
            ->whereDate('session_date', today())
            ->where('status', 'open')
            ->exists();

        if ($existing) {
            abort(409, 'Sudah ada session yang terbuka untuk hari ini.');
        }
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }
}

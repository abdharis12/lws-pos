<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\PosSession;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosSessionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['Owner', 'Admin'])) {
            abort(403);
        }

        $outlet = Outlet::first();
        $outletId = $outlet?->id;

        $currentSession = PosSession::with(['openedBy', 'closedBy', 'orders.payment'])
            ->where('outlet_id', $outletId)
            ->whereDate('session_date', today())
            ->where('status', 'open')
            ->first();

        $recentSessions = PosSession::with(['openedBy', 'closedBy'])
            ->where('outlet_id', $outletId)
            ->where('session_date', '<=', today())
            ->orderByDesc('session_date')
            ->orderByDesc('created_at')
            ->take(20)
            ->get();

        if ($currentSession) {
            $shiftsToday = Shift::with('employee.user')
                ->where('shift_date', today())
                ->whereHas('employee.user', fn ($q) => $q->role('Cashier'))
                ->get();

            $shiftSummaries = [];
            foreach ([1, 2] as $shiftNum) {
                $shift = $shiftsToday->firstWhere('shift_number', $shiftNum);

                $shiftOrders = $currentSession->orders->filter(function ($order) use ($shift, $shiftNum) {
                    if (! $shift) {
                        return false;
                    }
                    $shiftStart = Carbon::parse($shift->start_time);
                    $shiftEnd = Carbon::parse($shift->end_time);
                    $orderTime = $order->created_at;
                    $orderTimeOnly = Carbon::parse($orderTime->format('H:i'));

                    if ($shiftNum === 1) {
                        return $orderTimeOnly->between($shiftStart, $shiftEnd) || $orderTimeOnly->lt($shiftStart);
                    }

                    return $orderTimeOnly->between($shiftStart, $shiftEnd);
                });

                $shiftSummaries[] = [
                    'shift_number' => $shiftNum,
                    'employee_name' => $shift?->employee?->user?->name ?? '-',
                    'start_time' => $shift?->start_time ?? '-',
                    'end_time' => $shift?->end_time ?? '-',
                    'total_transactions' => $shiftOrders->count(),
                    'total_cash' => $shiftOrders->reduce(fn ($c, $o) => $c + ($o->payment?->method === 'cash' ? $o->total : 0), 0),
                    'total_non_cash' => $shiftOrders->reduce(fn ($c, $o) => $c + ($o->payment?->method !== 'cash' && $o->payment ? $o->total : 0), 0),
                ];
            }

            $currentSession->load('orders');
        } else {
            $shiftSummaries = [];
        }

        return Inertia::render('pos/Sessions', [
            'currentSession' => $currentSession,
            'recentSessions' => $recentSessions,
            'shiftSummaries' => $shiftSummaries,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'opening_balance' => 'required|numeric|min:0',
        ]);

        $user = $request->user();

        if (! $user->hasAnyRole(['Owner', 'Admin'])) {
            abort(403);
        }

        $outlet = Outlet::first();

        if (! $outlet) {
            abort(404, 'Outlet tidak ditemukan.');
        }

        $existingOpen = PosSession::where('outlet_id', $outlet->id)
            ->whereDate('session_date', today())
            ->where('status', 'open')
            ->exists();

        if ($existingOpen) {
            abort(409, 'Sudah ada session yang terbuka untuk hari ini.');
        }

        $session = PosSession::create([
            'outlet_id' => $outlet->id,
            'session_date' => today(),
            'opening_balance' => $validated['opening_balance'],
            'opened_at' => now(),
            'status' => 'open',
            'opened_by' => $user->id,
        ]);

        return response()->json($session->load('openedBy'), 201);
    }

    public function show(PosSession $posSession): JsonResponse
    {
        $posSession->load(['orders', 'openedBy', 'closedBy']);

        $shiftsToday = Shift::where('shift_date', today())
            ->whereHas('employee.user', fn ($q) => $q->role('Cashier'))
            ->get();

        $shiftSummaries = [];
        foreach ([1, 2] as $shiftNum) {
            $shift = $shiftsToday->firstWhere('shift_number', $shiftNum);
            if (! $shift) {
                continue;
            }

            $shiftStart = Carbon::parse($shift->start_time);
            $shiftEnd = Carbon::parse($shift->end_time);

            $shiftOrders = $posSession->orders->filter(function ($order) use ($shiftStart, $shiftEnd, $shiftNum) {
                $orderTime = $order->created_at;
                $orderTimeOnly = Carbon::parse($orderTime->format('H:i'));

                if ($shiftNum === 1) {
                    return $orderTimeOnly->between($shiftStart, $shiftEnd) || $orderTimeOnly->lt($shiftStart);
                }

                return $orderTimeOnly->between($shiftStart, $shiftEnd);
            });

            $shiftSummaries[] = [
                'shift_number' => $shiftNum,
                'employee_name' => $shift->employee?->user?->name ?? '-',
                'start_time' => $shift->start_time,
                'end_time' => $shift->end_time,
                'total_transactions' => $shiftOrders->count(),
                'total_cash' => $shiftOrders->reduce(fn ($c, $o) => $c + ($o->payment?->method === 'cash' ? $o->total : 0), 0),
                'total_non_cash' => $shiftOrders->reduce(fn ($c, $o) => $c + ($o->payment?->method !== 'cash' && $o->payment ? $o->total : 0), 0),
            ];
        }

        return response()->json([
            'session' => $posSession,
            'shift_summaries' => $shiftSummaries,
        ]);
    }

    public function close(Request $request, PosSession $posSession): JsonResponse
    {
        $user = $request->user();

        if (! $user->hasAnyRole(['Owner', 'Admin'])) {
            abort(403);
        }

        if ($posSession->status !== 'open') {
            abort(409, 'Session sudah ditutup.');
        }

        $posSession->load('orders.payment');

        $totalCash = $posSession->orders->reduce(fn ($c, $o) => $c + ($o->payment?->method === 'cash' ? $o->total : 0), 0);
        $totalNonCash = $posSession->orders->reduce(fn ($c, $o) => $c + ($o->payment?->method !== 'cash' && $o->payment ? $o->total : 0), 0);

        $posSession->update([
            'closed_at' => now(),
            'closed_by' => $user->id,
            'status' => 'closed',
            'total_cash' => $totalCash,
            'total_non_cash' => $totalNonCash,
            'total_transactions' => $posSession->orders->count(),
        ]);

        return response()->json($posSession);
    }
}

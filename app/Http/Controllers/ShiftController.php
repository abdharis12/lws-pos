<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Outlet;
use App\Models\Shift;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        $outlet = Outlet::first();
        $weekStart = $request->input('week_start', now()->startOfWeek()->format('Y-m-d'));
        $weekEnd = date('Y-m-d', strtotime($weekStart.' +6 days'));

        $shifts = Shift::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $outlet?->id))
            ->whereBetween('shift_date', [$weekStart, $weekEnd])
            ->orderBy('shift_date')
            ->orderBy('start_time')
            ->get()
            ->groupBy(fn ($shift) => $shift->shift_date->format('Y-m-d'));

        $employees = Employee::with('user')
            ->where('outlet_id', $outlet?->id)
            ->where('is_active', true)
            ->orderBy('position')
            ->get();

        $dates = [];
        for ($i = 0; $i < 7; $i++) {
            $dates[] = date('Y-m-d', strtotime($weekStart." +{$i} days"));
        }

        $monthStart = now()->startOfMonth()->format('Y-m-d');
        $monthEnd = now()->endOfMonth()->format('Y-m-d');

        $monthlyAllShifts = Shift::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $outlet?->id))
            ->whereBetween('shift_date', [$monthStart, $monthEnd])
            ->get();

        $monthlyPerEmployee = $monthlyAllShifts
            ->groupBy('employee_id')
            ->map(fn ($shifts) => [
                'employee' => $shifts->first()->employee,
                'total' => $shifts->count(),
            ])
            ->values();

        $monthlyPerDay = $monthlyAllShifts
            ->groupBy(fn ($shift) => $shift->shift_date->format('Y-m-d'))
            ->map(fn ($shifts, $date) => [
                'date' => $date,
                'total' => $shifts->count(),
            ])
            ->sortBy('date')
            ->values();

        $monthlyGrandTotal = $monthlyAllShifts->count();
        $activeEmployeeCount = $employees->count();

        return Inertia::render('admin/shifts/Index', [
            'shifts' => $shifts,
            'employees' => $employees,
            'dates' => $dates,
            'weekStart' => $weekStart,
            'monthlyPerEmployee' => $monthlyPerEmployee,
            'monthlyPerDay' => $monthlyPerDay,
            'monthlyGrandTotal' => $monthlyGrandTotal,
            'activeEmployeeCount' => $activeEmployeeCount,
            'monthLabel' => now()->locale('id')->translatedFormat('F Y'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'shift_date' => 'required|date',
            'shift_number' => 'nullable|integer|in:1,2',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $validated['shift_number'] ??= 1;

        $exists = Shift::where('employee_id', $validated['employee_id'])
            ->whereDate('shift_date', $validated['shift_date'])
            ->where('shift_number', $validated['shift_number'])
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['shift_date' => 'Karyawan sudah memiliki shift '.$validated['shift_number'].' di tanggal ini.']);
        }

        try {
            Shift::create($validated);
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'shifts_employee_date_shift_unique')) {
                return redirect()->back()->withErrors(['shift_date' => 'Karyawan sudah memiliki shift '.$validated['shift_number'].' di tanggal ini.']);
            }

            throw $e;
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift berhasil ditambahkan.']);

        return redirect()->back();
    }

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        $validated = $request->validate([
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $shift->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroy(Shift $shift): RedirectResponse
    {
        $shift->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift berhasil dihapus.']);

        return redirect()->back();
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shifts' => 'required|array|min:1',
            'shifts.*.employee_id' => 'required|exists:employees,id',
            'shifts.*.shift_date' => 'required|date',
            'shifts.*.shift_number' => 'nullable|integer|in:1,2',
            'shifts.*.start_time' => 'required|date_format:H:i',
            'shifts.*.end_time' => 'required|date_format:H:i|after:shifts.*.start_time',
        ]);

        $created = 0;
        foreach ($validated['shifts'] as $shiftData) {
            $shiftData['shift_number'] ??= 1;

            $exists = Shift::where('employee_id', $shiftData['employee_id'])
                ->whereDate('shift_date', $shiftData['shift_date'])
                ->where('shift_number', $shiftData['shift_number'])
                ->exists();

            if (! $exists) {
                try {
                    Shift::create($shiftData);
                    $created++;
                } catch (QueryException $e) {
                    if (! str_contains($e->getMessage(), 'shifts_employee_date_shift_unique')) {
                        throw $e;
                    }
                }
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$created} shift berhasil ditambahkan."]);

        return redirect()->back();
    }
}

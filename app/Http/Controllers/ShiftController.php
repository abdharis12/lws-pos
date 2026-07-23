<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Outlet;
use App\Models\Shift;
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
            ->groupBy('shift_date');

        $employees = Employee::with('user')
            ->where('outlet_id', $outlet?->id)
            ->where('is_active', true)
            ->orderBy('position')
            ->get();

        $dates = [];
        for ($i = 0; $i < 7; $i++) {
            $dates[] = date('Y-m-d', strtotime($weekStart." +{$i} days"));
        }

        return Inertia::render('admin/shifts/Index', [
            'shifts' => $shifts,
            'employees' => $employees,
            'dates' => $dates,
            'weekStart' => $weekStart,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'shift_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $exists = Shift::where('employee_id', $validated['employee_id'])
            ->whereDate('shift_date', $validated['shift_date'])
            ->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['shift_date' => 'Karyawan sudah memiliki shift di tanggal ini.']);
        }

        Shift::create($validated);

        return redirect()->back()->with('success', 'Shift berhasil ditambahkan.');
    }

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        $validated = $request->validate([
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $shift->update($validated);

        return redirect()->back()->with('success', 'Shift berhasil diperbarui.');
    }

    public function destroy(Shift $shift): RedirectResponse
    {
        $shift->delete();

        return redirect()->back()->with('success', 'Shift berhasil dihapus.');
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'shifts' => 'required|array|min:1',
            'shifts.*.employee_id' => 'required|exists:employees,id',
            'shifts.*.shift_date' => 'required|date',
            'shifts.*.start_time' => 'required|date_format:H:i',
            'shifts.*.end_time' => 'required|date_format:H:i|after:shifts.*.start_time',
        ]);

        $created = 0;
        foreach ($validated['shifts'] as $shiftData) {
            $exists = Shift::where('employee_id', $shiftData['employee_id'])
                ->whereDate('shift_date', $shiftData['shift_date'])
                ->exists();

            if (! $exists) {
                Shift::create($shiftData);
                $created++;
            }
        }

        return redirect()->back()->with('success', "{$created} shift berhasil ditambahkan.");
    }
}

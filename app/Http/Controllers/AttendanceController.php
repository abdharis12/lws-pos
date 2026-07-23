<?php

namespace App\Http\Controllers;

use App\Events\AttendanceUpdated;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Outlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(): Response
    {
        $outlet = Outlet::first();
        $today = now()->startOfDay();

        $attendances = Attendance::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $outlet?->id))
            ->where('clock_in_at', '>=', $today)
            ->orderBy('clock_in_at', 'desc')
            ->get();

        $employees = Employee::with('user')
            ->where('outlet_id', $outlet?->id)
            ->where('is_active', true)
            ->orderBy('position')
            ->get();

        $todayAttendance = $attendances->keyBy('employee_id');

        $stats = [
            'hadir' => $attendances->filter(fn ($a) => $a->clock_in_at !== null)->count(),
            'belum_absen' => $employees->filter(fn ($e) => ! $todayAttendance->has($e->id))->count(),
            'total_karyawan' => $employees->count(),
        ];

        $outlet->load('employees');

        return Inertia::render('admin/attendance/Index', [
            'attendances' => $attendances,
            'employees' => $employees,
            'todayAttendance' => $todayAttendance,
            'stats' => $stats,
            'outlet' => $outlet,
        ]);
    }

    public function clockIn(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'photo' => 'nullable|image|max:2048',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        if (! $employee->is_active) {
            return redirect()->back()->withErrors(['employee_id' => 'Karyawan tidak aktif.']);
        }

        $alreadyClockedIn = Attendance::where('employee_id', $employee->id)
            ->whereDate('clock_in_at', today())
            ->whereNull('clock_out_at')
            ->exists();

        if ($alreadyClockedIn) {
            return redirect()->back()->withErrors(['employee_id' => 'Sudah melakukan clock-in hari ini.']);
        }

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('attendance/photos', 'private');
        }

        $outlet = Outlet::first();
        $shift = $employee->shifts()->whereDate('shift_date', today())->first();

        $scheduleStart = $shift?->start_time ?? '08:00';
        $clockInTime = now();
        $scheduledStart = now()->setTimeFromTimeString($scheduleStart);
        $graceMinutes = 15;
        $isLate = $clockInTime->gt($scheduledStart->addMinutes($graceMinutes));

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'clock_in_at' => $clockInTime,
            'photo_path_in' => $photoPath ?? null,
            'latitude_in' => $validated['latitude'] ?? null,
            'longitude_in' => $validated['longitude'] ?? null,
            'status' => $isLate ? 'late' : 'present',
        ]);

        AttendanceUpdated::dispatch($attendance);

        return redirect()->back()->with('success', 'Clock-in berhasil.');
    }

    public function clockOut(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'photo' => 'nullable|image|max:2048',
        ]);

        $attendance = Attendance::where('employee_id', $validated['employee_id'])
            ->whereDate('clock_in_at', today())
            ->whereNull('clock_out_at')
            ->first();

        if (! $attendance) {
            return redirect()->back()->withErrors(['employee_id' => 'Belum melakukan clock-in hari ini.']);
        }

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('attendance/photos', 'private');
        }

        $attendance->update([
            'clock_out_at' => now(),
            'photo_path_out' => $photoPath ?? null,
            'latitude_out' => $validated['latitude'] ?? null,
            'longitude_out' => $validated['longitude'] ?? null,
        ]);

        AttendanceUpdated::dispatch($attendance);

        return redirect()->back()->with('success', 'Clock-out berhasil.');
    }

    public function recap(Request $request): Response
    {
        $outlet = Outlet::first();
        $month = $request->input('month', now()->format('Y-m'));
        $employeeId = $request->input('employee_id');

        $query = Attendance::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $outlet?->id))
            ->whereYear('clock_in_at', substr($month, 0, 4))
            ->whereMonth('clock_in_at', substr($month, 5, 2));

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        $attendances = $query->orderBy('clock_in_at', 'desc')->get();

        $employees = Employee::with('user')
            ->where('outlet_id', $outlet?->id)
            ->where('is_active', true)
            ->orderBy('position')
            ->get();

        $summary = $attendances->groupBy('employee_id')->map(function ($records) {
            $employee = $records->first()->employee;
            $totalHours = $records->reduce(function ($carry, $record) {
                if ($record->clock_in_at && $record->clock_out_at) {
                    return $carry + $record->clock_in_at->diffInMinutes($record->clock_out_at);
                }

                return $carry;
            }, 0);

            $lateDays = $records->filter(fn ($r) => $r->status === 'late')->count();

            return [
                'employee_id' => $employee->id,
                'employee_name' => $employee->user->name,
                'position' => $employee->position,
                'hadir' => $records->count(),
                'total_jam' => round($totalHours / 60, 1),
                'terlambat' => $lateDays,
            ];
        })->values();

        return Inertia::render('admin/attendance/Recap', [
            'attendances' => $attendances,
            'employees' => $employees,
            'summary' => $summary,
            'filterMonth' => $month,
            'filterEmployeeId' => $employeeId,
        ]);
    }
}

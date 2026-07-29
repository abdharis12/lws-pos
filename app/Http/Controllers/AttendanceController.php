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
    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    private function validateGeofence(Request $request, Outlet $outlet): void
    {
        $lat = $request->input('latitude');
        $lng = $request->input('longitude');

        if (! $lat || ! $lng || ! $outlet->latitude || ! $outlet->longitude || ! $outlet->geofence_radius_meters) {
            return;
        }

        $distance = $this->haversineDistance((float) $lat, (float) $lng, (float) $outlet->latitude, (float) $outlet->longitude);

        if ($distance > $outlet->geofence_radius_meters) {
            abort(403, 'Anda berada di luar radius geofence ('.number_format($distance, 0).'m dari outlet). Clock-in/out dibatalkan.');
        }
    }

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

        $outlet = Outlet::first();

        if ($outlet) {
            $this->validateGeofence($request, $outlet);
        }

        $alreadyClockedIn = Attendance::where('employee_id', $employee->id)
            ->whereDate('clock_in_at', today())
            ->whereNull('clock_out_at')
            ->exists();

        if ($alreadyClockedIn) {
            return redirect()->back()->withErrors(['employee_id' => 'Sudah melakukan clock-in hari ini.']);
        }

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('attendance/photos', 'public');
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Clock-in berhasil.']);

        return redirect()->back();
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

        $outlet = Outlet::first();

        if ($outlet) {
            $this->validateGeofence($request, $outlet);
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Clock-out berhasil.']);

        return redirect()->back();
    }

    public function recap(Request $request): Response
    {
        $outlet = Outlet::first();
        $month = $request->input('month', now()->format('Y-m'));
        $employeeId = $request->input('employee_id');

        $year = (int) substr($month, 0, 4);
        $monthNum = (int) substr($month, 5, 2);
        $daysInMonth = (int) now()->setYear($year)->setMonth($monthNum)->daysInMonth;

        $dates = [];
        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dates[] = sprintf('%04d-%02d-%02d', $year, $monthNum, $day);
        }

        $query = Attendance::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $outlet?->id))
            ->whereYear('clock_in_at', $year)
            ->whereMonth('clock_in_at', $monthNum);

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        $attendances = $query->orderBy('clock_in_at', 'desc')->get();

        $employees = Employee::with('user')
            ->where('outlet_id', $outlet?->id)
            ->where('is_active', true)
            ->orderBy('position')
            ->get();

        $summary = $employees->map(function ($employee) use ($attendances, $dates) {
            $employeeAttendances = $attendances->filter(fn ($a) => $a->employee_id === $employee->id);
            
            $dailyAttendance = [];
            foreach ($dates as $date) {
                $dayAttendances = $employeeAttendances->filter(fn ($a) => $a->clock_in_at && substr($a->clock_in_at, 0, 10) === $date);
                
                if ($dayAttendances->count() > 0) {
                    $first = $dayAttendances->first();
                    $last = $dayAttendances->last();
                    $dailyAttendance[$date] = [
                        'clock_in' => $first->clock_in_at ? substr($first->clock_in_at, 11, 5) : null,
                        'clock_out' => $last->clock_out_at ? substr($last->clock_out_at, 11, 5) : null,
                        'status' => $first->status,
                        'attended' => true,
                    ];
                } else {
                    $dailyAttendance[$date] = [
                        'clock_in' => null,
                        'clock_out' => null,
                        'status' => null,
                        'attended' => false,
                    ];
                }
            }

            $totalHours = $employeeAttendances->reduce(function ($carry, $record) {
                if ($record->clock_in_at && $record->clock_out_at) {
                    return $carry + $record->clock_in_at->diffInMinutes($record->clock_out_at);
                }

                return $carry;
            }, 0);

            $lateDays = $employeeAttendances->filter(fn ($r) => $r->status === 'late')->count();

            return [
                'employee_id' => $employee->id,
                'employee_name' => $employee->user->name,
                'position' => $employee->position,
                'hadir' => $employeeAttendances->count(),
                'total_jam' => round($totalHours / 60, 1),
                'terlambat' => $lateDays,
                'daily_attendance' => $dailyAttendance,
            ];
        });

        $monthlyStats = [
            'total_hadir' => $attendances->count(),
            'total_jam' => $attendances->reduce(function ($carry, $a) {
                if ($a->clock_in_at && $a->clock_out_at) {
                    return $carry + $a->clock_in_at->diffInMinutes($a->clock_out_at);
                }
                return $carry;
            }, 0),
            'total_terlambat' => $attendances->filter(fn ($a) => $a->status === 'late')->count(),
        ];

        return Inertia::render('admin/attendance/Recap', [
            'attendances' => $attendances,
            'employees' => $employees,
            'summary' => $summary->values(),
            'dates' => $dates,
            'filterMonth' => $month,
            'filterEmployeeId' => $employeeId,
            'monthlyStats' => $monthlyStats,
        ]);
    }
}

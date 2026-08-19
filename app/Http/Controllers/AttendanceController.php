<?php

namespace App\Http\Controllers;

use App\Events\AttendanceUpdated;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Outlet;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    private ?Outlet $outletCache = null;

    private function isAdmin(Request $request): bool
    {
        return $request->user()->hasAnyRole(['Owner', 'Admin']);
    }

    private function getEmployeeId(Request $request, ?int $requestedId = null): ?int
    {
        $employee = $request->user()->employee;

        if (! $employee) {
            return $requestedId;
        }

        return $this->isAdmin($request) ? $requestedId : $employee->id;
    }

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

    private function outlet(): ?Outlet
    {
        $outletId = $this->outletId();

        if ($this->outletCache === null && $outletId) {
            $this->outletCache = Outlet::find($outletId);
        }

        return $this->outletCache;
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }

    public function index(Request $request): Response
    {
        $today = now()->startOfDay();
        $employees = $this->employees($request);

        $attendances = $this->todayAttendances($request, $today);
        $todayAttendance = $attendances->keyBy('employee_id');
        $outlet = $this->outlet();

        return Inertia::render('admin/attendance/Index', [
            'attendances' => $attendances,
            'employees' => $employees,
            'todayAttendance' => $todayAttendance,
            'stats' => $this->indexStats($attendances, $employees, $todayAttendance),
            'outlet' => $outlet,
        ]);
    }

    public function clockIn(Request $request): RedirectResponse
    {
        $validated = $this->validatedAttendance($request);

        $employee = $this->resolveEmployee($request, (int) $validated['employee_id']);
        $this->authorizeAttendance($request, (int) $validated['employee_id'], $employee);
        $this->ensureActive($employee);

        if ($outlet = $this->outlet()) {
            $this->validateGeofence($request, $outlet);
        }

        if ($this->alreadyClockedIn($employee->id)) {
            return redirect()->back()->withErrors(['employee_id' => 'Sudah melakukan clock-in hari ini.']);
        }

        $photoPath = $this->storePhoto($request, 'private');
        $attendance = $this->createAttendance($employee, $validated, $photoPath);

        AttendanceUpdated::dispatch($attendance);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Clock-in berhasil.']);

        return redirect()->back();
    }

    public function clockOut(Request $request): RedirectResponse
    {
        $validated = $this->validatedAttendance($request);
        $employeeId = $this->getEmployeeId($request, (int) $validated['employee_id']);
        $this->authorizeClockOut($request, (int) $validated['employee_id'], $employeeId);

        $attendance = $this->openAttendance($employeeId);
        if (! $attendance) {
            return redirect()->back()->withErrors(['employee_id' => 'Belum melakukan clock-in hari ini.']);
        }

        if ($outlet = $this->outlet()) {
            $this->validateGeofence($request, $outlet);
        }

        $this->finishClockOut($attendance, $validated, $this->storePhoto($request, 'private'));

        AttendanceUpdated::dispatch($attendance);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Clock-out berhasil.']);

        return redirect()->back();
    }

    public function recap(Request $request): Response
    {
        $month = $request->input('month', now()->format('Y-m'));
        $employeeId = $this->isAdmin($request) ? $request->input('employee_id') : $this->getEmployeeId($request);

        [$year, $monthNum] = $this->month($month);
        $dates = $this->monthDates($year, $monthNum);

        $attendances = $this->monthAttendances($request, $year, $monthNum, $employeeId);
        $employees = $this->monthEmployees($request, $employeeId);
        $summary = $employees->map(fn ($employee) => $this->employeeRecap($employee, $attendances, $dates));

        return Inertia::render('admin/attendance/Recap', [
            'attendances' => $attendances,
            'employees' => $employees,
            'summary' => $summary->values(),
            'dates' => $dates,
            'filterMonth' => $month,
            'filterEmployeeId' => $employeeId,
            'monthlyStats' => $this->monthlyStats($attendances),
            'isAdmin' => $this->isAdmin($request),
        ]);
    }

    // ── index helpers ──────────────────────────────────────────────────────

    protected function employees(Request $request): Collection
    {
        $query = Employee::with('user')
            ->where('outlet_id', $this->outlet()?->id)
            ->where('is_active', true)
            ->orderBy('position');

        if (! $this->isAdmin($request)) {
            $query->where('id', $this->getEmployeeId($request));
        }

        return $query->get();
    }

    protected function todayAttendances(Request $request, $today): Collection
    {
        $query = Attendance::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $this->outlet()?->id))
            ->where('clock_in_at', '>=', $today)
            ->orderBy('clock_in_at', 'desc');

        if (! $this->isAdmin($request)) {
            $query->where('employee_id', $this->getEmployeeId($request));
        }

        return $query->get();
    }

    protected function indexStats(Collection $attendances, Collection $employees, Collection $todayAttendance): array
    {
        return [
            'hadir' => $attendances->filter(fn ($a) => $a->clock_in_at !== null)->count(),
            'belum_absen' => $employees->filter(fn ($e) => ! $todayAttendance->has($e->id))->count(),
            'total_karyawan' => $employees->count(),
        ];
    }

    // ── clock helpers ───────────────────────────────────────────────────────

    protected function validatedAttendance(Request $request): array
    {
        return $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'photo' => 'nullable|image|max:2048',
        ]);
    }

    protected function resolveEmployee(Request $request, int $requestedId): Employee
    {
        return Employee::findOrFail($this->getEmployeeId($request, $requestedId) ?? $requestedId);
    }

    protected function authorizeAttendance(Request $request, int $requestedId, Employee $employee): void
    {
        if (! $this->isAdmin($request) && $requestedId !== $employee->id) {
            abort(403);
        }
    }

    protected function ensureActive(Employee $employee): void
    {
        if (! $employee->is_active) {
            abort(redirect()->back()->withErrors(['employee_id' => 'Karyawan tidak aktif.']));
        }
    }

    protected function alreadyClockedIn(int $employeeId): bool
    {
        return Attendance::where('employee_id', $employeeId)
            ->where('clock_in_at', '>=', today()->startOfDay())
            ->where('clock_in_at', '<', today()->addDay()->startOfDay())
            ->whereNull('clock_out_at')
            ->exists();
    }

    protected function openAttendance(int $employeeId): ?Attendance
    {
        return Attendance::where('employee_id', $employeeId)
            ->where('clock_in_at', '>=', today()->startOfDay())
            ->where('clock_in_at', '<', today()->addDay()->startOfDay())
            ->whereNull('clock_out_at')
            ->first();
    }

    protected function storePhoto(Request $request, string $visibility): ?string
    {
        return $request->hasFile('photo') ? $request->file('photo')->store('attendance/photos', $visibility) : null;
    }

    protected function createAttendance(Employee $employee, array $validated, ?string $photoPath): Attendance
    {
        $scheduledStart = now()->setTimeFromTimeString($employee->shifts()
            ->whereBetween('shift_date', [today()->startOfDay(), today()->endOfDay()])
            ->first()?->start_time ?? '08:00');
        $isLate = now()->gt($scheduledStart->addMinutes(15));

        return Attendance::create([
            'employee_id' => $employee->id,
            'clock_in_at' => now(),
            'photo_path_in' => $photoPath,
            'latitude_in' => $validated['latitude'] ?? null,
            'longitude_in' => $validated['longitude'] ?? null,
            'status' => $isLate ? 'late' : 'present',
        ]);
    }

    protected function markEarlyLeave(Attendance $attendance): void
    {
        $shift = $attendance->employee->shifts()
            ->whereBetween('shift_date', [today()->startOfDay(), today()->endOfDay()])
            ->first();

        if ($shift) {
            $scheduledEnd = now()->setTimeFromTimeString($shift->end_time);
            $attendance->update(['early_leave' => $attendance->clock_out_at->lt($scheduledEnd)]);
        }
    }

    protected function authorizeClockOut(Request $request, int $requestedId, ?int $employeeId): void
    {
        if (! $this->isAdmin($request) && $requestedId !== $employeeId) {
            abort(403);
        }
    }

    protected function finishClockOut(Attendance $attendance, array $validated, ?string $photoPath): void
    {
        $attendance->update([
            'clock_out_at' => now(),
            'photo_path_out' => $photoPath,
            'latitude_out' => $validated['latitude'] ?? null,
            'longitude_out' => $validated['longitude'] ?? null,
        ]);

        $attendance->load('employee');
        $this->markEarlyLeave($attendance);
    }

    // ── recap helpers ───────────────────────────────────────────────────────

    protected function month(string $month): array
    {
        return [(int) substr($month, 0, 4), (int) substr($month, 5, 2)];
    }

    protected function monthDates(int $year, int $monthNum): array
    {
        $daysInMonth = (int) now()->setYear($year)->setMonth($monthNum)->daysInMonth;
        $dates = [];

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dates[] = sprintf('%04d-%02d-%02d', $year, $monthNum, $day);
        }

        return $dates;
    }

    protected function monthAttendances(Request $request, int $year, int $monthNum, ?int $employeeId): Collection
    {
        $query = Attendance::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $this->outlet()?->id))
            ->whereBetween('clock_in_at', [
                Carbon::create($year, $monthNum, 1)->startOfDay(),
                Carbon::create($year, $monthNum, 1)->endOfMonth(),
            ]);

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        return $query->orderBy('clock_in_at', 'desc')->get();
    }

    protected function monthEmployees(Request $request, ?int $employeeId): Collection
    {
        $employees = $this->employees($request);

        if ($employeeId) {
            return $employees->where('id', $employeeId)->values();
        }

        return $employees->values();
    }

    protected function employeeRecap(Employee $employee, Collection $attendances, array $dates): array
    {
        $employeeAttendances = $attendances->filter(fn ($a) => $a->employee_id === $employee->id);
        $totalMinutes = $this->totalMinutes($employeeAttendances);

        return [
            'employee_id' => $employee->id,
            'employee_name' => $employee->user->name,
            'position' => $employee->position,
            'hadir' => $employeeAttendances->count(),
            'total_jam' => round($totalMinutes / 60, 1),
            'terlambat' => $employeeAttendances->filter(fn ($r) => $r->status === 'late')->count(),
            'pulang_cepat' => $employeeAttendances->filter(fn ($r) => $r->early_leave)->count(),
            'daily_attendance' => $this->dailyAttendance($employeeAttendances, $dates),
        ];
    }

    protected function dailyAttendance(Collection $employeeAttendances, array $dates): array
    {
        $daily = [];

        foreach ($dates as $date) {
            $dayAttendances = $employeeAttendances->filter(fn ($a) => $a->clock_in_at && substr($a->clock_in_at, 0, 10) === $date);
            $daily[$date] = $this->entryForDay($dayAttendances);
        }

        return $daily;
    }

    protected function entryForDay(Collection $dayAttendances): array
    {
        if ($dayAttendances->isEmpty()) {
            return ['clock_in' => null, 'clock_out' => null, 'status' => null, 'attended' => false];
        }

        $first = $dayAttendances->first();
        $last = $dayAttendances->last();

        return [
            'clock_in' => $first->clock_in_at ? substr($first->clock_in_at, 11, 5) : null,
            'clock_out' => $last->clock_out_at ? substr($last->clock_out_at, 11, 5) : null,
            'status' => $first->status,
            'attended' => true,
            'early_leave' => $first->early_leave ?? false,
        ];
    }

    protected function totalMinutes(Collection $records): int
    {
        return $records->reduce(function ($carry, $record) {
            if ($record->clock_in_at && $record->clock_out_at) {
                return $carry + $record->clock_in_at->diffInMinutes($record->clock_out_at);
            }

            return $carry;
        }, 0);
    }

    protected function monthlyStats(Collection $attendances): array
    {
        return [
            'total_hadir' => $attendances->count(),
            'total_jam' => $this->totalMinutes($attendances),
            'total_terlambat' => $attendances->filter(fn ($a) => $a->status === 'late')->count(),
            'total_pulang_cepat' => $attendances->filter(fn ($a) => $a->early_leave)->count(),
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Shift::class);

        $weekStart = $request->input('week_start', now()->startOfWeek()->format('Y-m-d'));
        $weekEnd = date('Y-m-d', strtotime($weekStart.' +6 days'));

        $shifts = $this->weekShifts($weekStart, $weekEnd);
        $employees = $this->activeEmployees();
        $dates = $this->weekDates($weekStart);
        $monthly = $this->monthlySummary();

        return Inertia::render('admin/shifts/Index', [
            'shifts' => $shifts,
            'employees' => $employees,
            'dates' => $dates,
            'weekStart' => $weekStart,
            'monthlyPerEmployee' => $monthly['perEmployee'],
            'monthlyPerDay' => $monthly['perDay'],
            'monthlyGrandTotal' => $monthly['grandTotal'],
            'activeEmployeeCount' => $employees->count(),
            'monthLabel' => now()->locale('id')->translatedFormat('F Y'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Shift::class);

        $validated = $this->validateSingle($request);

        $error = $this->conflictError($validated);
        if ($error) {
            return redirect()->back()->withErrors(['shift_date' => $error]);
        }

        try {
            Shift::create($validated);
        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'shifts_employee_date_shift_unique')) {
                return redirect()->back()->withErrors(['shift_date' => $this->conflictMessage($validated)]);
            }

            throw $e;
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift berhasil ditambahkan.']);

        return redirect()->back();
    }

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        $this->authorize('update', $shift);
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
        $this->authorize('delete', $shift);
        $shift->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift berhasil dihapus.']);

        return redirect()->back();
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        $this->authorize('create', Shift::class);
        $validated = $request->validate([
            'shifts' => 'required|array|min:1',
            'shifts.*.employee_id' => 'required|exists:employees,id',
            'shifts.*.shift_date' => 'required|date',
            'shifts.*.shift_number' => 'nullable|integer|in:1,2',
            'shifts.*.start_time' => 'required|date_format:H:i',
            'shifts.*.end_time' => 'required|date_format:H:i|after:shifts.*.start_time',
        ]);

        $records = collect($validated['shifts'])->map(function (array $shiftData): array {
            $shiftData['shift_number'] ??= 1;
            $shiftData['shift_date'] = Carbon::parse($shiftData['shift_date'])->format('Y-m-d');
            $shiftData['created_at'] = now();
            $shiftData['updated_at'] = now();

            return $shiftData;
        })->all();

        $inserts = $this->filterExisting($records);

        $created = Shift::insertOrIgnore($inserts);

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$created} shift berhasil ditambahkan."]);

        return redirect()->back();
    }

    protected function filterExisting(array $records): array
    {
        $existingKeys = Shift::whereIn('employee_id', array_column($records, 'employee_id'))
            ->whereIn('shift_date', array_column($records, 'shift_date'))
            ->get()
            ->map(fn (Shift $shift) => $shift->employee_id.'|'.$shift->shift_date->format('Y-m-d').'|'.$shift->shift_number)
            ->flip();

        return collect($records)
            ->reject(fn (array $record) => $existingKeys->has(
                $record['employee_id'].'|'.$record['shift_date'].'|'.$record['shift_number'],
            ))
            ->all();
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    protected function weekShifts(string $weekStart, string $weekEnd): Collection
    {
        return Shift::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $this->outletId()))
            ->whereBetween('shift_date', [$weekStart, $weekEnd])
            ->orderBy('shift_date')
            ->orderBy('start_time')
            ->get()
            ->groupBy(fn ($shift) => $shift->shift_date->format('Y-m-d'));
    }

    protected function activeEmployees(): Collection
    {
        return Employee::with('user')
            ->where('outlet_id', $this->outletId())
            ->where('is_active', true)
            ->orderBy('position')
            ->get();
    }

    protected function weekDates(string $weekStart): array
    {
        $dates = [];
        for ($i = 0; $i < 7; $i++) {
            $dates[] = date('Y-m-d', strtotime($weekStart." +{$i} days"));
        }

        return $dates;
    }

    protected function monthlySummary(): array
    {
        $all = Shift::with('employee.user')
            ->whereHas('employee', fn ($q) => $q->where('outlet_id', $this->outletId()))
            ->whereBetween('shift_date', [now()->startOfMonth()->format('Y-m-d'), now()->endOfMonth()->format('Y-m-d')])
            ->get();

        $perEmployee = $all->groupBy('employee_id')
            ->map(fn ($shifts) => [
                'employee' => $shifts->first()->employee,
                'total' => $shifts->count(),
            ])
            ->values();

        $perDay = $all->groupBy(fn ($shift) => $shift->shift_date->format('Y-m-d'))
            ->map(fn ($shifts, $date) => ['date' => $date, 'total' => $shifts->count()])
            ->sortBy('date')
            ->values();

        return [
            'perEmployee' => $perEmployee,
            'perDay' => $perDay,
            'grandTotal' => $all->count(),
        ];
    }

    protected function validateSingle(Request $request): array
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'shift_date' => 'required|date',
            'shift_number' => 'nullable|integer|in:1,2',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $validated['shift_number'] ??= 1;

        return $validated;
    }

    protected function existsConflict(array $validated): bool
    {
        return Shift::where('employee_id', $validated['employee_id'])
            ->where('shift_date', $validated['shift_date'])
            ->where('shift_number', $validated['shift_number'])
            ->exists();
    }

    protected function conflictMessage(array $validated): string
    {
        return 'Karyawan sudah memiliki shift '.$validated['shift_number'].' di tanggal ini.';
    }

    protected function conflictError(array $validated): ?string
    {
        return $this->existsConflict($validated) ? $this->conflictMessage($validated) : null;
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\SalaryComponent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalaryComponentController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', SalaryComponent::class);

        $components = SalaryComponent::with('employee.user')->get();
        $employees = Employee::where('is_active', true)->with('user')->orderBy('position')->get();

        return Inertia::render('admin/payroll/SalaryComponents', [
            'components' => $components,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', SalaryComponent::class);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'base_salary' => 'required|numeric|min:0',
            'salary_type' => 'required|in:monthly,daily',
            'meal_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'overtime_rate_per_hour' => 'nullable|numeric|min:0',
        ]);

        if ($validated['meal_allowance'] === '' || $validated['meal_allowance'] === null) {
            $validated['meal_allowance'] = 0;
        }
        if ($validated['transport_allowance'] === '' || $validated['transport_allowance'] === null) {
            $validated['transport_allowance'] = 0;
        }
        if ($validated['overtime_rate_per_hour'] === '' || $validated['overtime_rate_per_hour'] === null) {
            $validated['overtime_rate_per_hour'] = 0;
        }

        SalaryComponent::updateOrCreate(
            ['employee_id' => $validated['employee_id']],
            $validated
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Komponen gaji berhasil disimpan.']);

        return redirect()->back();
    }

    public function update(Request $request, SalaryComponent $salaryComponent): RedirectResponse
    {
        $this->authorize('update', $salaryComponent);

        $validated = $request->validate([
            'base_salary' => 'required|numeric|min:0',
            'salary_type' => 'required|in:monthly,daily',
            'meal_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'overtime_rate_per_hour' => 'nullable|numeric|min:0',
        ]);

        $validated['meal_allowance'] ??= 0;
        $validated['transport_allowance'] ??= 0;
        $validated['overtime_rate_per_hour'] ??= 0;

        $salaryComponent->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Komponen gaji berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroy(SalaryComponent $salaryComponent): RedirectResponse
    {
        $this->authorize('delete', $salaryComponent);

        $salaryComponent->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Komponen gaji berhasil dihapus.']);

        return redirect()->back();
    }
}

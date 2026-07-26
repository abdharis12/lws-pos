<?php

namespace App\Http\Controllers;

use App\Models\SalaryComponent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalaryComponentController extends Controller
{
    public function index(): Response
    {
        $components = SalaryComponent::with('employee.user')->get();

        return Inertia::render('admin/payroll/SalaryComponents', [
            'components' => $components,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'base_salary' => 'required|numeric|min:0',
            'salary_type' => 'required|in:monthly,daily',
            'meal_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'overtime_rate_per_hour' => 'nullable|numeric|min:0',
        ]);

        SalaryComponent::updateOrCreate(
            ['employee_id' => $validated['employee_id']],
            $validated
        );

        return redirect()->back()->with('success', 'Komponen gaji berhasil disimpan.');
    }

    public function update(Request $request, SalaryComponent $salaryComponent): RedirectResponse
    {
        $validated = $request->validate([
            'base_salary' => 'required|numeric|min:0',
            'salary_type' => 'required|in:monthly,daily',
            'meal_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'overtime_rate_per_hour' => 'nullable|numeric|min:0',
        ]);

        $salaryComponent->update($validated);

        return redirect()->back()->with('success', 'Komponen gaji berhasil diperbarui.');
    }

    public function destroy(SalaryComponent $salaryComponent): RedirectResponse
    {
        $salaryComponent->delete();

        return redirect()->back()->with('success', 'Komponen gaji berhasil dihapus.');
    }
}

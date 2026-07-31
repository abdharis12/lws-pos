<?php

namespace App\Http\Controllers;

use App\Models\Deduction;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeductionController extends Controller
{
    public function index(): Response
    {
        $deductions = Deduction::with('employee.user')->latest()->get();

        return Inertia::render('admin/payroll/Deductions', [
            'deductions' => $deductions,
            'employees' => Employee::where('is_active', true)->with('user')->orderBy('position')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period' => 'required|string|max:7',
            'type' => 'required|in:late,loan,other',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        Deduction::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Potongan berhasil ditambahkan.']);

        return redirect()->back();
    }

    public function update(Request $request, Deduction $deduction): RedirectResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:late,loan,other',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $deduction->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Potongan berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroy(Deduction $deduction): RedirectResponse
    {
        $deduction->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Potongan berhasil dihapus.']);

        return redirect()->back();
    }
}

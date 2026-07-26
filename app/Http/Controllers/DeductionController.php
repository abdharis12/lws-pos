<?php

namespace App\Http\Controllers;

use App\Models\Deduction;
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

        return redirect()->back()->with('success', 'Potongan berhasil ditambahkan.');
    }

    public function update(Request $request, Deduction $deduction): RedirectResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:late,loan,other',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $deduction->update($validated);

        return redirect()->back()->with('success', 'Potongan berhasil diperbarui.');
    }

    public function destroy(Deduction $deduction): RedirectResponse
    {
        $deduction->delete();

        return redirect()->back()->with('success', 'Potongan berhasil dihapus.');
    }
}

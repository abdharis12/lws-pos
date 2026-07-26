<?php

namespace App\Http\Controllers;

use App\Models\Bonus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BonusController extends Controller
{
    public function index(): Response
    {
        $bonuses = Bonus::with('employee.user', 'approvedBy')->latest()->get();

        return Inertia::render('admin/payroll/Bonuses', [
            'bonuses' => $bonuses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period' => 'required|string|max:7',
            'amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:500',
        ]);

        Bonus::create([
            ...$validated,
            'approved_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', 'Bonus berhasil ditambahkan.');
    }

    public function update(Request $request, Bonus $bonus): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:500',
        ]);

        $bonus->update($validated);

        return redirect()->back()->with('success', 'Bonus berhasil diperbarui.');
    }

    public function destroy(Bonus $bonus): RedirectResponse
    {
        $bonus->delete();

        return redirect()->back()->with('success', 'Bonus berhasil dihapus.');
    }
}

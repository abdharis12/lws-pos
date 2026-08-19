<?php

namespace App\Http\Controllers;

use App\Models\Bonus;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BonusController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Bonus::class);

        $bonuses = Bonus::with('employee.user', 'approvedBy')->latest()->get();

        return Inertia::render('admin/payroll/Bonuses', [
            'bonuses' => $bonuses,
            'employees' => Employee::where('is_active', true)->with('user')->orderBy('position')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Bonus::class);

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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bonus berhasil ditambahkan.']);

        return redirect()->back();
    }

    public function update(Request $request, Bonus $bonus): RedirectResponse
    {
        $this->authorize('update', $bonus);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'reason' => 'required|string|max:500',
        ]);

        $bonus->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bonus berhasil diperbarui.']);

        return redirect()->back();
    }

    public function destroy(Bonus $bonus): RedirectResponse
    {
        $this->authorize('delete', $bonus);

        $bonus->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bonus berhasil dihapus.']);

        return redirect()->back();
    }
}

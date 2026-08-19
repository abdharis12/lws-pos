<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Payslip;
use App\Services\PayrollService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayslipController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Payslip::class);

        $period = $request->input('period', date('Y-m'));

        $payslips = Payslip::with([
            'employee.user',
            'employee.deductions' => fn ($q) => $q->where('period', $period),
        ])
            ->where('period', $period)
            ->orderBy('created_at', 'desc')
            ->get();

        $periods = Payslip::select('period')
            ->distinct()
            ->orderBy('period', 'desc')
            ->pluck('period');

        return Inertia::render('admin/payroll/Payslips', [
            'payslips' => $payslips,
            'period' => $period,
            'periods' => $periods,
        ]);
    }

    public function show(Payslip $payslip): Response
    {
        $this->authorize('view', $payslip);

        $payslip->load([
            'employee.user',
            'employee.deductions' => fn ($q) => $q->where('period', $payslip->period),
        ]);

        return Inertia::render('admin/payroll/PayslipShow', [
            'payslip' => $payslip,
        ]);
    }

    public function generate(Request $request, PayrollService $payrollService): RedirectResponse
    {
        $this->authorize('create', Payslip::class);

        $period = $request->input('period', date('Y-m'));

        $payrollService->generatePayslips($period);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Slip gaji periode '.$period.' berhasil digenerate.']);

        return redirect()->back();
    }

    public function generateSingle(Request $request, Employee $employee, PayrollService $payrollService): RedirectResponse
    {
        $this->authorize('create', Payslip::class);

        $period = $request->input('period', date('Y-m'));

        $payrollService->generateForEmployee($employee, $period);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Slip gaji berhasil digenerate.']);

        return redirect()->back();
    }

    public function approve(Payslip $payslip): RedirectResponse
    {
        $this->authorize('update', $payslip);

        $payslip->update(['status' => 'approved']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Slip gaji telah disetujui.']);

        return redirect()->back();
    }

    public function markPaid(Request $request, Payslip $payslip): RedirectResponse
    {
        $this->authorize('update', $payslip);

        $validated = $request->validate([
            'paid_method' => 'required|string|in:cash,transfer',
        ]);

        $payslip->update([
            'status' => 'paid',
            'paid_at' => now(),
            'paid_method' => $validated['paid_method'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Slip gaji telah ditandai dibayar.']);

        return redirect()->back();
    }
}

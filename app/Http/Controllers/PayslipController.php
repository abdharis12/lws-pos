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
        $period = $request->input('period', date('Y-m'));

        $payslips = Payslip::with('employee.user')
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
        $payslip->load('employee.user');

        return Inertia::render('admin/payroll/PayslipShow', [
            'payslip' => $payslip,
        ]);
    }

    public function generate(Request $request, PayrollService $payrollService): RedirectResponse
    {
        $period = $request->input('period', date('Y-m'));

        $payrollService->generatePayslips($period);

        return redirect()->back()->with('success', 'Slip gaji periode '.$period.' berhasil digenerate.');
    }

    public function generateSingle(Request $request, Employee $employee, PayrollService $payrollService): RedirectResponse
    {
        $period = $request->input('period', date('Y-m'));

        $payrollService->generateForEmployee($employee, $period);

        return redirect()->back()->with('success', 'Slip gaji berhasil digenerate.');
    }

    public function approve(Payslip $payslip): RedirectResponse
    {
        $payslip->update(['status' => 'approved']);

        return redirect()->back()->with('success', 'Slip gaji telah disetujui.');
    }

    public function markPaid(Request $request, Payslip $payslip): RedirectResponse
    {
        $validated = $request->validate([
            'paid_method' => 'required|string|in:cash,transfer',
        ]);

        $payslip->update([
            'status' => 'paid',
            'paid_at' => now(),
            'paid_method' => $validated['paid_method'],
        ]);

        return redirect()->back()->with('success', 'Slip gaji telah ditandai dibayar.');
    }
}

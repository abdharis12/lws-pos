<?php

namespace App\Http\Controllers;

use App\Exports\PayrollReportExport;
use App\Models\Payslip;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PayrollController extends Controller
{
    public function index(Request $request): Response
    {
        $period = $request->input('period', date('Y-m'));

        $payslips = Payslip::with('employee.user')
            ->where('period', $period)
            ->get();

        $totalLaborCost = (float) $payslips->sum('take_home_pay');
        $totalBaseSalary = (float) $payslips->sum('base_salary');
        $totalAllowances = (float) $payslips->sum('allowances_total');
        $totalBonuses = (float) $payslips->sum('bonus_total');
        $totalOvertime = (float) $payslips->sum('overtime_total');
        $totalDeductions = (float) $payslips->sum('deduction_total');
        $paidCount = $payslips->where('status', 'paid')->count();
        $approvedCount = $payslips->where('status', 'approved')->count();
        $draftCount = $payslips->where('status', 'draft')->count();

        $periods = Payslip::select('period')
            ->distinct()
            ->orderBy('period', 'desc')
            ->pluck('period');

        return Inertia::render('admin/payroll/Report', [
            'payslips' => $payslips,
            'period' => $period,
            'periods' => $periods,
            'summary' => [
                'total_labor_cost' => $totalLaborCost,
                'total_base_salary' => $totalBaseSalary,
                'total_allowances' => $totalAllowances,
                'total_bonuses' => $totalBonuses,
                'total_overtime' => $totalOvertime,
                'total_deductions' => $totalDeductions,
                'paid_count' => $paidCount,
                'approved_count' => $approvedCount,
                'draft_count' => $draftCount,
            ],
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $period = $request->input('period', date('Y-m'));

        return Excel::download(new PayrollReportExport($period), 'laporan-payroll-'.$period.'.xlsx');
    }
}

<?php

namespace App\Http\Controllers;

use App\Exports\PayrollReportExport;
use App\Models\Payslip;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PayrollController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Payslip::class);

        $period = $request->input('period', date('Y-m'));
        $payslips = Payslip::with('employee.user')->where('period', $period)->get();
        $periods = Payslip::select('period')->distinct()->orderBy('period', 'desc')->pluck('period');

        return Inertia::render('admin/payroll/Report', [
            'payslips' => $payslips,
            'period' => $period,
            'periods' => $periods,
            'summary' => $this->buildSummary($payslips),
        ]);
    }

    public function export(Request $request): BinaryFileResponse
    {
        $this->authorize('viewAny', Payslip::class);

        $period = $request->input('period', date('Y-m'));

        return Excel::download(new PayrollReportExport($period), 'laporan-payroll-'.$period.'.xlsx');
    }

    protected function buildSummary(Collection $payslips): array
    {
        return [
            'total_labor_cost' => (float) $payslips->sum('take_home_pay'),
            'total_base_salary' => (float) $payslips->sum('base_salary'),
            'total_allowances' => (float) $payslips->sum('allowances_total'),
            'total_bonuses' => (float) $payslips->sum('bonus_total'),
            'total_overtime' => (float) $payslips->sum('overtime_total'),
            'total_deductions' => (float) $payslips->sum('deduction_total'),
            'paid_count' => $payslips->where('status', 'paid')->count(),
            'approved_count' => $payslips->where('status', 'approved')->count(),
            'draft_count' => $payslips->where('status', 'draft')->count(),
        ];
    }
}

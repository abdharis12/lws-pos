<?php

namespace App\Http\Controllers;

use App\Models\Outlet;
use App\Models\Payslip;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfController extends Controller
{
    private const DEDUCTION_TYPE_LABELS = [
        'late' => 'Keterlambatan',
        'loan' => 'Kasbon/Pinjaman',
        'other' => 'Lainnya',
    ];

    public function payslip(Payslip $payslip)
    {
        $payslip->load([
            'employee.user',
            'employee.deductions' => fn ($q) => $q->where('period', $payslip->period),
        ]);

        @ini_set('memory_limit', '256M');

        $outletId = $this->outletId();
        $outlet = $outletId ? Outlet::find($outletId) : null;

        $pdf = Pdf::loadView('pdfs.payslip', [
            'payslip' => $payslip,
            'employee' => $payslip->employee,
            'outlet' => $outlet,
            'deductionTypeLabels' => self::DEDUCTION_TYPE_LABELS,
        ]);

        return $pdf->download('payslip-'.$payslip->employee->user->name.'-'.$payslip->period.'.pdf');
    }

    protected function outletId(): ?int
    {
        return auth()->user()?->employee?->outlet_id;
    }
}

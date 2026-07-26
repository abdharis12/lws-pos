<?php

namespace App\Http\Controllers;

use App\Models\Payslip;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfController extends Controller
{
    public function payslip(Payslip $payslip)
    {
        $payslip->load('employee.user');

        $pdf = Pdf::loadView('pdfs.payslip', [
            'payslip' => $payslip,
            'employee' => $payslip->employee,
        ]);

        return $pdf->download('payslip-'.$payslip->employee->user->name.'-'.$payslip->period.'.pdf');
    }
}

<?php

namespace App\Exports;

use App\Models\Payslip;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PayrollReportExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(
        protected string $period,
    ) {}

    public function collection()
    {
        return Payslip::with('employee.user')
            ->where('period', $this->period)
            ->orderBy('created_at')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Nama Karyawan',
            'Posisi',
            'Gaji Pokok',
            'Tunjangan',
            'Bonus',
            'Lembur',
            'Potongan',
            'Take Home Pay',
            'Status',
            'Tanggal Bayar',
        ];
    }

    public function map($payslip): array
    {
        return [
            $payslip->employee?->user?->name ?? 'Unknown',
            $payslip->employee?->position ?? '-',
            (float) $payslip->base_salary,
            (float) $payslip->allowances_total,
            (float) $payslip->bonus_total,
            (float) $payslip->overtime_total,
            (float) $payslip->deduction_total,
            (float) $payslip->take_home_pay,
            $payslip->status,
            $payslip->paid_at?->format('d/m/Y') ?? '-',
        ];
    }
}

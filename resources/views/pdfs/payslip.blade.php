<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Slip Gaji - {{ $employee->user->name }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4F6B6A; padding-bottom: 10px; }
        .header h1 { color: #4F6B6A; margin: 0; font-size: 18px; }
        .header p { margin: 2px 0; color: #666; }
        .info { margin-bottom: 20px; }
        .info table { width: 100%; }
        .info td { padding: 2px 5px; }
        .info td:last-child { text-align: right; font-weight: bold; }
        table.details { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.details th { background: #4F6B6A; color: white; padding: 8px; text-align: left; }
        table.details td { padding: 6px 8px; border-bottom: 1px solid #ddd; }
        table.details tr:last-child td { border-bottom: 2px solid #4F6B6A; font-weight: bold; }
        .total { text-align: right; font-size: 14px; margin-top: 10px; }
        .total span { color: #4F6B6A; font-size: 18px; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SLIP GAJI</h1>
        <p>Bubur Kang Lw</p>
        <p>Periode: {{ $payslip->period }}</p>
    </div>

    <div class="info">
        <table>
            <tr><td>Nama</td><td>{{ $employee->user->name }}</td></tr>
            <tr><td>Posisi</td><td>{{ $employee->position }}</td></tr>
            <tr><td>Status</td><td>{{ $payslip->status }}</td></tr>
        </table>
    </div>

    <table class="details">
        <tr>
            <th>Komponen</th>
            <th style="text-align: right">Jumlah</th>
        </tr>
        <tr>
            <td>Gaji Pokok</td>
            <td style="text-align: right">Rp {{ number_format($payslip->base_salary, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Tunjangan</td>
            <td style="text-align: right">Rp {{ number_format($payslip->allowances_total, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Bonus</td>
            <td style="text-align: right">Rp {{ number_format($payslip->bonus_total, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Lembur</td>
            <td style="text-align: right">Rp {{ number_format($payslip->overtime_total, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Potongan</td>
            <td style="text-align: right">(Rp {{ number_format($payslip->deduction_total, 0, ',', '.') }})</td>
        </tr>
        <tr>
            <td>Take Home Pay</td>
            <td style="text-align: right; color: #4F6B6A;">Rp {{ number_format($payslip->take_home_pay, 0, ',', '.') }}</td>
        </tr>
    </table>

    @if($payslip->status === 'paid')
    <p style="text-align: right; color: #666;">
        Dibayar: {{ $payslip->paid_at?->format('d/m/Y') ?? '-' }}
        ({{ $payslip->paid_method ?? '-' }})
    </p>
    @endif

    <div class="footer">
        Slip gaji ini digenerate secara otomatis oleh sistem POS Bubur Kang Lw.
    </div>
</body>
</html>

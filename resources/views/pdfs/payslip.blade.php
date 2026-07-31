<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Slip Gaji - {{ $employee->user->name }}</title>
    <style>
        @php
            $logoPath = public_path('img/lws-logo-pdf.png');
            $logoSrc = file_exists($logoPath)
                ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath))
                : '';
        @endphp
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; line-height: 1.5; color: #2C3E3D; margin: 0; padding: 0; }
        .brand { color: #4F6B6A; }
        .brand-dark { color: #3A5251; }
        .gold { color: #C5B489; }
        .header { text-align: center; padding-bottom: 14px; border-bottom: 3px solid #C5B489; margin-bottom: 16px; }
        .header img { height: 64px; width: 64px; object-fit: contain; margin-bottom: 6px; }
        .header h1 { margin: 0; font-size: 17px; font-weight: bold; letter-spacing: 0.5px; color: #4F6B6A; }
        .header .tagline { margin: 0; font-size: 10px; color: #C5B489; letter-spacing: 2px; text-transform: uppercase; }
        .header .contact { margin: 4px 0 0; font-size: 9px; color: #6B7F7E; }
        .title-row { text-align: center; margin-bottom: 16px; }
        .title-row h2 { margin: 0; font-size: 15px; letter-spacing: 3px; color: #3A5251; text-transform: uppercase; }
        .title-row .period { font-size: 10px; color: #6B7F7E; margin-top: 2px; }
        .section { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .section td { padding: 4px 2px; }
        .section .label { width: 130px; color: #6B7F7E; }
        .section .value { font-weight: bold; color: #2C3E3D; }
        .details { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .details th { background: #4F6B6A; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }
        .details th.right { text-align: right; }
        .details td { padding: 6px 10px; border-bottom: 1px solid #E3E9E7; font-size: 11px; }
        .details td.right { text-align: right; }
        .details tr.group td { background: #F2F4F1; font-weight: bold; color: #3A5251; }
        .details tr.total td { background: #E9EDEA; border-top: 2px solid #C5B489; border-bottom: 2px solid #C5B489; font-weight: bold; }
        .details tr.total .grand { color: #4F6B6A; font-size: 13px; }
        .sub-row td { color: #6B7F7E; padding-left: 22px; }
        .paid-info { text-align: right; color: #6B7F7E; font-size: 10px; margin-bottom: 6px; }
        .footer { margin-top: 26px; text-align: center; color: #9AA8A6; font-size: 8.5px; border-top: 1px solid #DDE4E2; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        @if ($logoSrc)
            <img src="{{ $logoSrc }}" alt="{{ $outlet?->name ?? 'Logo' }}">
        @endif
        <h1>{{ $outlet?->name ?? 'Bubur Kang Lw' }}</h1>
        <p class="tagline">Payslip — Slip Gaji Karyawan</p>
        @if ($outlet?->address || $outlet?->phone)
            <p class="contact">
                {{ $outlet?->address }}
                @if ($outlet?->address && $outlet?->phone)
                    &nbsp;|&nbsp;
                @endif
                {{ $outlet?->phone }}
            </p>
        @endif
    </div>

    <div class="title-row">
        <h2>Slip Gaji</h2>
        <div class="period">Periode: {{ $payslip->period }}</div>
    </div>

    <table class="section">
        <tr>
            <td class="label">Nama</td>
            <td class="value">{{ $employee->user->name }}</td>
            <td class="label">Posisi</td>
            <td class="value">{{ $employee->position }}</td>
        </tr>
        <tr>
            <td class="label">Periode</td>
            <td class="value">{{ $payslip->period }}</td>
            <td class="label">Status</td>
            <td class="value">{{ ucfirst($payslip->status) }}</td>
        </tr>
    </table>

    <table class="details">
        <tr>
            <th>Komponen</th>
            <th class="right">Jumlah</th>
        </tr>
        <tr>
            <td>Gaji Pokok</td>
            <td class="right">Rp {{ number_format($payslip->base_salary, 0, ',', '.') }}</td>
        </tr>
        <tr class="group">
            <td>Tunjangan</td>
            <td class="right">Rp {{ number_format($payslip->allowances_total, 0, ',', '.') }}</td>
        </tr>
        <tr class="sub-row">
            <td>&nbsp;&nbsp;Uang Makan</td>
            <td class="right">Rp {{ number_format($payslip->meal_allowance, 0, ',', '.') }}</td>
        </tr>
        <tr class="sub-row">
            <td>&nbsp;&nbsp;Transport</td>
            <td class="right">Rp {{ number_format($payslip->transport_allowance, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Bonus</td>
            <td class="right">Rp {{ number_format($payslip->bonus_total, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Lembur</td>
            <td class="right">Rp {{ number_format($payslip->overtime_total, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td>Potongan</td>
            <td class="right">(Rp {{ number_format($payslip->deduction_total, 0, ',', '.') }})</td>
        </tr>
        @if ($payslip->employee->deductions->isNotEmpty())
            @foreach ($payslip->employee->deductions as $deduction)
                <tr class="sub-row">
                    <td>&nbsp;&nbsp;- {{ $deductionTypeLabels[$deduction->type] ?? $deduction->type }}{{ $deduction->notes ? ': '.$deduction->notes : '' }}</td>
                    <td class="right">(Rp {{ number_format($deduction->amount, 0, ',', '.') }})</td>
                </tr>
            @endforeach
        @endif
        <tr class="total">
            <td>Take Home Pay</td>
            <td class="right"><span class="grand">Rp {{ number_format($payslip->take_home_pay, 0, ',', '.') }}</span></td>
        </tr>
    </table>

    @if ($payslip->status === 'paid')
        <div class="paid-info">
            Dibayar: {{ $payslip->paid_at?->format('d/m/Y') ?? '-' }}
            ({{ $payslip->paid_method === 'cash' ? 'Tunai' : 'Transfer' }})
        </div>
    @endif

    <div class="footer">
        Slip gaji ini digenerate secara otomatis oleh sistem POS {{ $outlet?->name ?? 'Bubur Kang Lw' }}.
    </div>
</body>
</html>

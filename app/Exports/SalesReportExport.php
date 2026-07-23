<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SalesReportExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(
        protected string $period,
        protected string $date,
    ) {}

    public function collection()
    {
        $query = Order::with('payment')
            ->whereIn('status', ['paid', 'completed', 'settled']);

        match ($this->period) {
            'weekly' => $query->whereDate('created_at', '>=', $this->date)
                ->whereDate('created_at', '<=', date('Y-m-d', strtotime($this->date.' +6 days'))),
            'monthly' => $query->whereYear('created_at', substr($this->date, 0, 4))
                ->whereMonth('created_at', substr($this->date, 5, 2)),
            default => $query->whereDate('created_at', $this->date),
        };

        return $query->orderByDesc('created_at')->get();
    }

    public function headings(): array
    {
        return [
            'ID Order',
            'Tanggal',
            'Type',
            'Status',
            'Subtotal',
            'Pajak',
            'Diskon',
            'Total',
            'Metode Bayar',
            'Status Bayar',
        ];
    }

    public function map($order): array
    {
        return [
            $order->id,
            $order->created_at->format('d/m/Y H:i'),
            $order->order_type,
            $order->status,
            (float) $order->subtotal,
            (float) $order->tax,
            (float) $order->discount,
            (float) $order->total,
            $order->payment?->method ?? '-',
            $order->payment?->status ?? '-',
        ];
    }
}

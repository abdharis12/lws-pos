<?php

namespace App\Exports;

use App\Models\Order;
use Carbon\Carbon;
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
            'weekly' => $query->where('created_at', '>=', Carbon::parse($this->date)->startOfDay())
                ->where('created_at', '<=', Carbon::parse($this->date)->addDays(6)->endOfDay()),
            'monthly' => $query->whereBetween('created_at', [
                Carbon::createFromFormat('Y-m', $this->date)->startOfMonth(),
                Carbon::createFromFormat('Y-m', $this->date)->endOfMonth(),
            ]),
            default => $query->whereBetween('created_at', [
                Carbon::parse($this->date)->startOfDay(),
                Carbon::parse($this->date)->endOfDay(),
            ]),
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

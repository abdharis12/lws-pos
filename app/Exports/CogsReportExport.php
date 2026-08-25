<?php

namespace App\Exports;

use App\Models\OrderItem;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class CogsReportExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(
        protected int $outletId,
        protected string $period,
        protected string $dateFrom,
        protected string $dateTo,
    ) {}

    public function collection(): Collection
    {
        $groupBy = match ($this->period) {
            'daily' => "TO_CHAR(created_at, 'YYYY-MM-DD')",
            'weekly' => "TO_CHAR(created_at, 'IYYY-IW')",
            'monthly' => "TO_CHAR(created_at, 'YYYY-MM')",
            default => "TO_CHAR(created_at, 'YYYY-MM-DD')",
        };

        return OrderItem::whereHas('order', function ($q) {
            $q->whereHas('tableSession.table', fn ($t) => $t->where('outlet_id', $this->outletId))
                ->whereBetween('created_at', [$this->dateFrom, $this->dateTo])
                ->whereIn('status', ['paid', 'completed']);
        })
            ->selectRaw("{$groupBy} as period, SUM(total_cost) as cogs, SUM(qty * base_price) as revenue")
            ->groupBy('period')
            ->orderBy('period')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Periode',
            'COGS',
            'Revenue',
            'COGS % dari Penjualan',
            'Gross Profit',
            'Margin (%)',
        ];
    }

    public function map($row): array
    {
        $cogs = (float) $row->cogs;
        $revenue = (float) $row->revenue;
        $grossProfit = $revenue - $cogs;
        $margin = $revenue > 0 ? ($grossProfit / $revenue) * 100 : 0;

        return [
            $row->period,
            round($cogs, 2),
            round($revenue, 2),
            $revenue > 0 ? round(($cogs / $revenue) * 100, 2) : 0,
            round($grossProfit, 2),
            round($margin, 2),
        ];
    }
}

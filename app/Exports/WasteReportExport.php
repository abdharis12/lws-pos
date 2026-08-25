<?php

namespace App\Exports;

use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class WasteReportExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(
        protected int $outletId,
        protected string $dateFrom,
        protected string $dateTo,
        protected ?int $ingredientId = null,
    ) {}

    public function collection(): Collection
    {
        $query = StockMovement::where('outlet_id', $this->outletId)
            ->where('type', 'waste')
            ->with(['ingredient', 'user'])
            ->whereBetween('created_at', [
                Carbon::parse($this->dateFrom)->startOfDay(),
                Carbon::parse($this->dateTo)->endOfDay(),
            ]);

        if ($this->ingredientId) {
            $query->where('ingredient_id', $this->ingredientId);
        }

        return $query->latest()->get();
    }

    public function headings(): array
    {
        return [
            'Tanggal',
            'Bahan Baku',
            'Satuan',
            'Qty (Waste)',
            'HPP per Unit',
            'Total Biaya',
            'Alasan',
            'Catatan',
            'Dicatat Oleh',
        ];
    }

    public function map($movement): array
    {
        $notes = $movement->notes ?? '';
        $reason = '';

        if (preg_match('/^\[([^\]]+)\]/', $notes, $matches)) {
            $reason = $matches[1];
            $notes = trim(substr($notes, strlen($matches[0])));
        }

        return [
            $movement->created_at->format('d/m/Y H:i'),
            $movement->ingredient->name,
            $movement->ingredient->unit,
            abs((float) $movement->qty),
            (float) $movement->unit_cost,
            abs((float) $movement->total_cost),
            $reason ?: '-',
            $notes ?: '-',
            $movement->user?->name ?? 'Sistem',
        ];
    }
}

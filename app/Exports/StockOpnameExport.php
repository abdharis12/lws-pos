<?php

namespace App\Exports;

use App\Models\Ingredient;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StockOpnameExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(
        protected int $outletId,
        protected ?array $ingredientIds = null,
    ) {}

    public function collection(): Collection
    {
        $query = Ingredient::where('outlet_id', $this->outletId)
            ->where('is_active', true)
            ->orderBy('name');

        if ($this->ingredientIds) {
            $query->whereIn('id', $this->ingredientIds);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Bahan Baku',
            'Satuan',
            'Stok Sistem',
            'Stok Fisik (Isi Manual)',
            'Selisih (Fisik - Sistem)',
            'HPP per Unit',
            'Nilai Selisih',
            'Status',
            'Min Stok',
        ];
    }

    public function map($ingredient): array
    {
        $systemStock = (float) $ingredient->current_stock;
        $unitCost = (float) $ingredient->cost_per_unit;
        $minStock = (float) $ingredient->min_stock;
        $isLowStock = $systemStock <= $minStock;

        return [
            $ingredient->id,
            $ingredient->name,
            $ingredient->unit,
            $systemStock,
            '', // Stok Fisik - diisi manual saat opname
            '', // Selisih - dihitung nanti
            $unitCost,
            '', // Nilai Selisih
            $isLowStock ? 'STOK MENIPIS' : ($systemStock <= 0 ? 'STOK HABIS' : 'NORMAL'),
            $minStock,
        ];
    }
}

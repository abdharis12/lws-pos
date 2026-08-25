<?php

namespace App\Exports;

use App\Models\Menu;
use App\Models\OrderItem;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class HppVarianceExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(
        protected int $outletId,
        protected string $dateFrom,
        protected string $dateTo,
    ) {}

    public function collection(): Collection
    {
        $outletId = $this->outletId;
        $dateFrom = $this->dateFrom;
        $dateTo = $this->dateTo;

        $menus = Menu::whereHas('category', fn ($q) => $q->where('outlet_id', $outletId))
            ->with(['recipes.ingredient', 'category'])
            ->get();

        $orderItems = OrderItem::whereHas('order', function ($q) use ($outletId, $dateFrom, $dateTo) {
            $q->whereHas('tableSession.table', fn ($t) => $t->where('outlet_id', $outletId))
                ->whereBetween('created_at', [$dateFrom, $dateTo])
                ->whereIn('status', ['paid', 'completed']);
        })
            ->with(['menu.recipes.ingredient'])
            ->get()
            ->groupBy('menu_id');

        return $menus->map(function (Menu $menu) use ($orderItems) {
            $theoreticalHpp = $menu->calculateHpp();
            $menuItems = $orderItems->get($menu->id, collect());

            $actualTotalCost = $menuItems->sum('total_cost');
            $actualQty = $menuItems->sum('qty');
            $actualHpp = $actualQty > 0 ? $actualTotalCost / $actualQty : 0;

            $variance = $actualHpp - $theoreticalHpp;
            $variancePercent = $theoreticalHpp > 0 ? ($variance / $theoreticalHpp) * 100 : 0;
            $marginPercent = $menu->price > 0 ? (($menu->price - $theoreticalHpp) / $menu->price) * 100 : 0;

            return [
                'menu_id' => $menu->id,
                'menu_name' => $menu->name,
                'category' => $menu->category?->name ?? '-',
                'price' => $menu->price,
                'theoretical_hpp' => round($theoreticalHpp, 2),
                'actual_hpp' => round($actualHpp, 2),
                'variance' => round($variance, 2),
                'variance_percent' => round($variancePercent, 2),
                'margin_percent' => round($marginPercent, 2),
                'qty_sold' => $actualQty,
                'actual_total_cost' => round($actualTotalCost, 2),
            ];
        })->filter(fn ($m) => $m['qty_sold'] > 0 || $m['theoretical_hpp'] > 0)->values();
    }

    public function headings(): array
    {
        return [
            'Menu',
            'Kategori',
            'Harga Jual',
            'HPP Teoritis',
            'HPP Aktual',
            'Variance (Nominal)',
            'Variance (%)',
            'Margin (%)',
            'Terjual (Porsi)',
            'Total Biaya Aktual',
        ];
    }

    public function map($row): array
    {
        return [
            $row['menu_name'],
            $row['category'],
            (float) $row['price'],
            (float) $row['theoretical_hpp'],
            (float) $row['actual_hpp'],
            (float) $row['variance'],
            (float) $row['variance_percent'],
            (float) $row['margin_percent'],
            (int) $row['qty_sold'],
            (float) $row['actual_total_cost'],
        ];
    }
}

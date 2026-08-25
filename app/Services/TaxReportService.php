<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SupplierInvoice;

class TaxReportService
{
    public function getPpnOutput(int $outletId, string $dateFrom, string $dateTo): array
    {
        $orders = Order::forOutlet($outletId)
            ->whereIn('status', ['paid', 'completed'])
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->get();

        $totalTax = $orders->sum('tax');
        $totalRevenue = $orders->sum('total');

        $details = $orders->map(fn ($order) => [
            'order_id' => $order->id,
            'ppn_amount' => round($order->tax, 2),
            'revenue' => round($order->total, 2),
            'date' => $order->created_at,
        ]);

        return [
            'type' => 'output',
            'description' => 'PPN Keluaran (dari penjualan)',
            'date_range' => ['from' => $dateFrom, 'to' => $dateTo],
            'total_ppn' => round($totalTax, 2),
            'total_revenue' => round($totalRevenue, 2),
            'ppn_rate' => 11,
            'details' => $details,
        ];
    }

    public function getPpnInput(int $outletId, string $dateFrom, string $dateTo): array
    {
        $invoices = SupplierInvoice::where('outlet_id', $outletId)
            ->whereBetween('invoice_date', [$dateFrom, $dateTo])
            ->with('supplier')
            ->get();

        $totalTax = $invoices->sum('tax_amount');
        $totalBase = $invoices->sum('total_amount');

        $details = $invoices->map(fn ($invoice) => [
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'supplier' => $invoice->supplier?->name,
            'ppn_amount' => round($invoice->tax_amount, 2),
            'subtotal' => round($invoice->total_amount, 2),
            'date' => $invoice->invoice_date,
        ]);

        return [
            'type' => 'input',
            'description' => 'PPN Masukan (dari pembelian supplier)',
            'date_range' => ['from' => $dateFrom, 'to' => $dateTo],
            'total_ppn' => round($totalTax, 2),
            'total_base' => round($totalBase, 2),
            'ppn_rate' => 11,
            'details' => $details,
        ];
    }

    public function getPpnNetto(int $outletId, string $dateFrom, string $dateTo): array
    {
        $ppnOutput = $this->getPpnOutput($outletId, $dateFrom, $dateTo);
        $ppnInput = $this->getPpnInput($outletId, $dateFrom, $dateTo);

        $ppnOutputTotal = $ppnOutput['total_ppn'];
        $ppnInputTotal = $ppnInput['total_ppn'];
        $ppnNetto = $ppnOutputTotal - $ppnInputTotal;

        return [
            'date_range' => ['from' => $dateFrom, 'to' => $dateTo],
            'ppn_output' => $ppnOutputTotal,
            'ppn_input' => $ppnInputTotal,
            'ppn_netto' => round($ppnNetto, 2),
            'status' => $ppnNetto > 0 ? 'terutang' : ($ppnNetto < 0 ? 'claimed' : 'nol'),
            'label' => $ppnNetto > 0
                ? 'PPN Terutang (harus dibayar ke negara)'
                : ($ppnNetto < 0 ? 'PPN claimed (dapat dikreditkan)' : 'PPN nol'),
        ];
    }
}

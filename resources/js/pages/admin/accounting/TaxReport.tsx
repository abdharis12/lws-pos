import { Head, router } from '@inertiajs/react';
import { Receipt, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TaxLine {
    id: number;
    invoice_number: string;
    date: string;
    partner_name: string;
    ppn_amount: number;
    dpp_amount: number;
}

interface Props {
    ppnOutput: TaxLine[];
    ppnInput: TaxLine[];
    ppnNetto: number;
    filters: { date_from?: string; date_to?: string };
}

export default function TaxReport({ ppnOutput, ppnInput, ppnNetto, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    const totalOutput = ppnOutput.reduce((sum, l) => sum + l.ppn_amount, 0);
    const totalInput = ppnInput.reduce((sum, l) => sum + l.ppn_amount, 0);
    const totalDppOutput = ppnOutput.reduce((sum, l) => sum + l.dpp_amount, 0);
    const totalDppInput = ppnInput.reduce((sum, l) => sum + l.dpp_amount, 0);

    function applyFilter() {
        router.get(
            '/admin/accounting/tax-report',
            {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Tax Report (PPN) - Accounting" />

            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Receipt className="size-3.5 text-[#4F6B6A]" />
                            <span>Accounting</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Tax Report (PPN)
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Laporan Pajak Pertambahan Nilai output dan input.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input type="date" className="w-44 border-[#CFC0A4]/50 bg-white" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <span className="text-xs text-slate-400">s/d</span>
                    <Input type="date" className="w-44 border-[#CFC0A4]/50 bg-white" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button onClick={applyFilter} className="rounded-md bg-[#4F6B6A] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F6B6A]/90">
                        Terapkan
                    </button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <ArrowUpRight className="size-3" /> PPN Output (Penjualan)
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">
                                Rp {totalOutput.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-slate-500">DPP: Rp {totalDppOutput.toLocaleString('id-ID')}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-blue-600 uppercase">
                                <ArrowDownLeft className="size-3" /> PPN Input (Pembelian)
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-blue-700">
                                Rp {totalInput.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-slate-500">DPP: Rp {totalDppInput.toLocaleString('id-ID')}</p>
                        </CardContent>
                    </Card>
                    <Card className={`shadow-sm ${ppnNetto >= 0 ? 'border-rose-200 bg-rose-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                        <CardContent className="pt-6">
                            <p className={`text-[10px] font-medium tracking-wider uppercase ${ppnNetto >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {ppnNetto >= 0 ? 'PPN Terutang' : 'PPN Claimed'}
                            </p>
                            <p className={`mt-1 font-serif text-2xl font-bold ${ppnNetto >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                Rp {Math.abs(ppnNetto).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                            <Badge variant="outline" className={`mt-2 text-xs ${ppnNetto >= 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                {ppnNetto >= 0 ? 'Terutang (Bayar)' : 'Claim (Refund)'}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>

                {/* PPN Output Table */}
                <Card className="mb-6 overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-emerald-700">PPN Output (Penjualan)</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">No. Invoice</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Mitra</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">DPP</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">PPN (11%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ppnOutput.map((line) => (
                                    <tr key={line.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{line.invoice_number}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                            {new Date(line.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{line.partner_name}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">
                                            Rp {line.dpp_amount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-700">
                                            Rp {line.ppn_amount.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-emerald-200 bg-emerald-50/50 font-bold">
                                    <td colSpan={3} className="px-4 py-3 text-sm text-emerald-700 uppercase">Total</td>
                                    <td className="px-4 py-3 text-right text-emerald-700">
                                        Rp {totalDppOutput.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-emerald-700">
                                        Rp {totalOutput.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {ppnOutput.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-xs text-slate-500 italic">Belum ada data PPN output.</p>
                        </div>
                    )}
                </Card>

                {/* PPN Input Table */}
                <Card className="mb-6 overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-blue-700">PPN Input (Pembelian)</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">No. Invoice</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Tanggal</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Mitra</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">DPP</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">PPN (11%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ppnInput.map((line) => (
                                    <tr key={line.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{line.invoice_number}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                                            {new Date(line.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{line.partner_name}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">
                                            Rp {line.dpp_amount.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-blue-700">
                                            Rp {line.ppn_amount.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-blue-200 bg-blue-50/50 font-bold">
                                    <td colSpan={3} className="px-4 py-3 text-sm text-blue-700 uppercase">Total</td>
                                    <td className="px-4 py-3 text-right text-blue-700">
                                        Rp {totalDppInput.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-blue-700">
                                        Rp {totalInput.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {ppnInput.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-xs text-slate-500 italic">Belum ada data PPN input.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

TaxReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Accounting', href: '/admin/accounting/tax-report' },
        { title: 'Tax Report (PPN)', href: '/admin/accounting/tax-report' },
    ],
};

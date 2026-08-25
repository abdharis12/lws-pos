import { Head, router } from '@inertiajs/react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PnlAccount {
    id: number;
    account_code: string;
    account_name: string;
    total: number;
}

interface PnlData {
    revenue: PnlAccount[];
    cogs: PnlAccount[];
    expenses: PnlAccount[];
    total_revenue: number;
    total_cogs: number;
    gross_profit: number;
    total_expenses: number;
    net_profit: number;
    gross_margin: number;
    net_margin: number;
}

interface Props {
    pnl: PnlData;
    filters: { date_from?: string; date_to?: string };
}

export default function PnlReport({ pnl, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    function applyFilter() {
        router.get(
            '/admin/accounting/pnl',
            {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Profit & Loss - Accounting" />

            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <TrendingUp className="size-3.5 text-[#4F6B6A]" />
                            <span>Accounting</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Profit & Loss
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Laporan laba rugi periode berjalan.
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

                {/* Summary Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <TrendingUp className="size-3" /> Total Revenue
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">
                                Rp {pnl.total_revenue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <DollarSign className="size-3" /> Gross Profit
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">
                                Rp {pnl.gross_profit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-slate-500">Margin: {pnl.gross_margin.toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                    <Card className={`shadow-sm ${pnl.net_profit >= 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}>
                        <CardContent className="pt-6">
                            <p className={`flex items-center gap-1 text-[10px] font-medium tracking-wider uppercase ${pnl.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {pnl.net_profit >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />} Net Profit
                            </p>
                            <p className={`mt-1 font-serif text-2xl font-bold ${pnl.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                Rp {pnl.net_profit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-slate-500">Margin: {pnl.net_margin.toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Revenue Section */}
                <Card className="mb-6 border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-emerald-700">Revenue (Pendapatan)</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kode</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Nama Akun</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pnl.revenue.map((r) => (
                                    <tr key={r.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-[#4F6B6A]">{r.account_code}</td>
                                        <td className="px-4 py-3 text-slate-800">{r.account_name}</td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-700">
                                            Rp {r.total.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-emerald-200 bg-emerald-50/50 font-bold">
                                    <td colSpan={2} className="px-4 py-3 text-sm text-emerald-700 uppercase">Total Revenue</td>
                                    <td className="px-4 py-3 text-right text-emerald-700">
                                        Rp {pnl.total_revenue.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                {/* COGS Section */}
                <Card className="mb-6 border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-rose-700">COGS (Harga Pokok Penjualan)</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kode</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Nama Akun</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pnl.cogs.map((c) => (
                                    <tr key={c.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-[#4F6B6A]">{c.account_code}</td>
                                        <td className="px-4 py-3 text-slate-800">{c.account_name}</td>
                                        <td className="px-4 py-3 text-right font-medium text-rose-700">
                                            Rp {c.total.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-rose-200 bg-rose-50/50 font-bold">
                                    <td colSpan={2} className="px-4 py-3 text-sm text-rose-700 uppercase">Total COGS</td>
                                    <td className="px-4 py-3 text-right text-rose-700">
                                        Rp {pnl.total_cogs.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                {/* Gross Profit */}
                <Card className="mb-6 border-2 border-[#4F6B6A]/30 bg-[#4F6B6A]/5 shadow-sm">
                    <CardContent className="flex items-center justify-between py-5">
                        <span className="font-serif text-lg font-bold text-[#4F6B6A]">Gross Profit</span>
                        <div className="text-right">
                            <p className="font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp {pnl.gross_profit.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-slate-500">({pnl.gross_margin.toFixed(1)}%)</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses Section */}
                <Card className="mb-6 border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-amber-700">Operating Expenses (Beban Operasional)</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Kode</th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Nama Akun</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pnl.expenses.map((ex) => (
                                    <tr key={ex.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-[#4F6B6A]">{ex.account_code}</td>
                                        <td className="px-4 py-3 text-slate-800">{ex.account_name}</td>
                                        <td className="px-4 py-3 text-right font-medium text-amber-700">
                                            Rp {ex.total.toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-amber-200 bg-amber-50/50 font-bold">
                                    <td colSpan={2} className="px-4 py-3 text-sm text-amber-700 uppercase">Total Expenses</td>
                                    <td className="px-4 py-3 text-right text-amber-700">
                                        Rp {pnl.total_expenses.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>

                {/* Net Profit */}
                <Card className={`border-2 shadow-sm ${pnl.net_profit >= 0 ? 'border-emerald-400 bg-emerald-50/50' : 'border-rose-400 bg-rose-50/50'}`}>
                    <CardContent className="flex items-center justify-between py-6">
                        <div className="flex items-center gap-3">
                            {pnl.net_profit >= 0 ? <TrendingUp className="size-6 text-emerald-600" /> : <TrendingDown className="size-6 text-rose-600" />}
                            <span className="font-serif text-xl font-bold text-[#4F6B6A]">Net Profit (Laba Bersih)</span>
                        </div>
                        <div className="text-right">
                            <p className={`font-serif text-3xl font-bold ${pnl.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                Rp {pnl.net_profit.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-slate-500">({pnl.net_margin.toFixed(1)}%)</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

PnlReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Accounting', href: '/admin/accounting/pnl' },
        { title: 'Profit & Loss', href: '/admin/accounting/pnl' },
    ],
};

import { Head, router } from '@inertiajs/react';
import { BarChart3, DollarSign, PieChart, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface BenchmarkEntry {
    outlet_id: number;
    outlet_name: string;
    revenue: number;
    cogs: number;
    profit: number;
    margin_percent: number;
    orders_count: number;
}

interface PnlEntry {
    outlet_id: number;
    outlet_name: string;
    revenue: number;
    cogs: number;
    operating_expenses: number;
    net_profit: number;
    margin_percent: number;
}

interface Summary {
    total_revenue: number;
    total_cogs: number;
    total_profit: number;
    avg_margin: number;
}

interface Props {
    groupPnl: PnlEntry[];
    benchmarks: BenchmarkEntry[];
    summary: Summary;
    filters: { date_from?: string; date_to?: string; period?: string };
}

export default function Consolidated({ groupPnl, benchmarks, summary, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [period, setPeriod] = useState(filters.period ?? 'monthly');

    function applyFilter() {
        router.get(
            '/admin/reports/consolidated',
            {
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                period,
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Laporan Konsolidasi - Reports" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <BarChart3 className="size-3.5 text-[#4F6B6A]" />
                            <span>Reports</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Laporan Konsolidasi
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Perbandingan performa antar outlet dan analisis profitabilitas.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Select value={period} onValueChange={(v) => {
 setPeriod(v); 
}}>
                        <SelectTrigger className="w-40 border-[#CFC0A4]/50 bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="daily">Harian</SelectItem>
                            <SelectItem value="weekly">Mingguan</SelectItem>
                            <SelectItem value="monthly">Bulanan</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="date" className="w-40 border-[#CFC0A4]/50 bg-white" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <span className="text-xs text-slate-400">s/d</span>
                    <Input type="date" className="w-40 border-[#CFC0A4]/50 bg-white" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button
                        onClick={applyFilter}
                        className="rounded-md bg-[#4F6B6A] px-4 py-2 text-sm font-medium text-white hover:bg-[#4F6B6A]/90"
                    >
                        Terapkan
                    </button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-4">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                <DollarSign className="size-3" /> Total Revenue
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp {summary.total_revenue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-rose-600 uppercase">Total COGS</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-rose-700">
                                Rp {summary.total_cogs.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
                                <TrendingUp className="size-3" /> Total Profit
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">
                                Rp {summary.total_profit.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                <PieChart className="size-3" /> Rata-rata Margin
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                {summary.avg_margin.toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Benchmark Table */}
                <Card className="mb-6 overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Benchmark per Outlet</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Outlet</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Revenue</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">COGS</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Profit</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Margin %</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                {benchmarks.map((b) => (
                                    <tr key={b.outlet_id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{b.outlet_name}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">Rp {b.revenue.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right text-rose-600">Rp {b.cogs.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right font-medium text-emerald-700">Rp {b.profit.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Badge variant="outline" className={b.margin_percent >= 60 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : b.margin_percent >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200'}>
                                                {b.margin_percent.toFixed(1)}%
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-600">{b.orders_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {benchmarks.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">Belum Ada Data</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Belum ada data benchmark outlet.</p>
                        </div>
                    )}
                </Card>

                {/* P&L Breakdown per Outlet */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">P&L per Outlet</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Outlet</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Revenue</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">COGS</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Operasional</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Net Profit</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Margin %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupPnl.map((p) => (
                                    <tr key={p.outlet_id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{p.outlet_name}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">Rp {p.revenue.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right text-rose-600">Rp {p.cogs.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right text-amber-600">Rp {p.operating_expenses.toLocaleString('id-ID')}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${p.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            Rp {p.net_profit.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Badge variant="outline" className={p.margin_percent >= 20 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}>
                                                {p.margin_percent.toFixed(1)}%
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {groupPnl.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">Belum Ada Data P&L</h4>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

Consolidated.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Reports', href: '/admin/reports/consolidated' },
        { title: 'Consolidated', href: '/admin/reports/consolidated' },
    ],
};

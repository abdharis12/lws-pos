import { Head, router } from '@inertiajs/react';
import { BarChart3, Download, FileSpreadsheet, PieChart, TrendingDown, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface VarianceRow {
    menu_id: number;
    menu_name: string;
    category: string | null;
    price: number;
    theoretical_hpp: number;
    actual_hpp: number;
    variance: number;
    variance_percent: number;
    margin_percent: number;
    qty_sold: number;
}

interface MenuEngineering {
    quadrants: {
        stars: VarianceRow[];
        plowhorses: VarianceRow[];
        puzzles: VarianceRow[];
        dogs: VarianceRow[];
    };
    averages: { popularity: number; margin: number };
    summary: {
        stars: number;
        plowhorses: number;
        puzzles: number;
        dogs: number;
    };
}

interface CogsReport {
    period: string;
    summary: {
        total_cogs: number;
        total_revenue: number;
        cogs_percent: number;
    };
    details: {
        period: string;
        cogs: number;
        revenue: number;
        cogs_percent: number;
    }[];
}

interface WasteRow {
    date: string;
    ingredient: string;
    unit: string;
    qty: number;
    unit_cost: number;
    total_cost: number;
    notes: string | null;
    recorded_by: string | null;
}

interface Props {
    variance: VarianceRow[];
    menuEngineering: MenuEngineering;
    cogs: CogsReport;
    waste: WasteRow[];
    topVarianceMenus: VarianceRow[];
    lowMarginMenus: VarianceRow[];
    filters: { date_from: string; date_to: string; cogs_period: string };
}

const quadrantMeta = [
    {
        key: 'stars' as const,
        title: 'Stars',
        desc: 'Populer & Margin Tinggi — pertahankan dan promosikan',
        className: 'border-emerald-200 bg-emerald-50',
        badge: 'bg-emerald-600',
        icon: '⭐',
    },
    {
        key: 'plowhorses' as const,
        title: 'Plowhorses',
        desc: 'Populer tapi margin rendah — optimalkan HPP / naikkan harga',
        className: 'border-blue-200 bg-blue-50',
        badge: 'bg-blue-600',
        icon: '🐎',
    },
    {
        key: 'puzzles' as const,
        title: 'Puzzles',
        desc: 'Margin tinggi tapi jarang dipesan — dorong penjualan',
        className: 'border-amber-200 bg-amber-50',
        badge: 'bg-amber-600',
        icon: '🧩',
    },
    {
        key: 'dogs' as const,
        title: 'Dogs',
        desc: 'Jarang dipesan & margin rendah — pertimbangkan hapus dari menu',
        className: 'border-rose-200 bg-rose-50',
        badge: 'bg-rose-600',
        icon: '🐕',
    },
];

export default function HppReport({
    variance,
    menuEngineering,
    cogs,
    waste,
    lowMarginMenus,
    filters,
}: Props) {
    const [cogsPeriod, setCogsPeriod] = useState(filters.cogs_period ?? 'daily');

    const wasteTotal = waste.reduce((sum, w) => sum + w.total_cost, 0);

    const exportQuery = new URLSearchParams({
        date_from: filters.date_from,
        date_to: filters.date_to,
        cogs_period: cogsPeriod,
    }).toString();

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Laporan HPP - Cost Control" />

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <BarChart3 className="size-3.5 text-[#4F6B6A]" />
                            <span>Cost Control</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Laporan HPP & Profitabilitas
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Analisis HPP teoritis vs aktual, menu engineering, COGS,
                            dan waste.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-[#CFC0A4]/50 bg-white text-xs"
                            onClick={() =>
                                router.visit(`/admin/reports/hpp/export/variance?${exportQuery}`)
                            }
                        >
                            <Download className="mr-1 size-3.5" /> HPP Variance
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-[#CFC0A4]/50 bg-white text-xs"
                            onClick={() => router.visit('/admin/reports/hpp/export/stock-opname')}
                        >
                            <FileSpreadsheet className="mr-1 size-3.5" /> Stock Opname
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-[#CFC0A4]/50 bg-white text-xs"
                            onClick={() =>
                                router.visit(`/admin/reports/hpp/export/waste?${exportQuery}`)
                            }
                        >
                            <Download className="mr-1 size-3.5" /> Waste Report
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-[#CFC0A4]/50 bg-white text-xs"
                            onClick={() => router.visit(`/admin/reports/hpp/export/cogs?${exportQuery}`)}
                        >
                            <FileSpreadsheet className="mr-1 size-3.5" /> COGS Report
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                <BarChart3 className="size-3" /> Total COGS
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp{' '}
                                {cogs.summary.total_cogs.toLocaleString('id-ID', {
                                    maximumFractionDigits: 0,
                                })}
                            </p>
                            <p className="text-xs text-slate-500">
                                {cogs.summary.cogs_percent}% dari penjualan
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                <PieChart className="size-3" /> Total Penjualan
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-slate-800">
                                Rp{' '}
                                {cogs.summary.total_revenue.toLocaleString('id-ID', {
                                    maximumFractionDigits: 0,
                                })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-rose-600 uppercase">
                                <TrendingDown className="size-3" /> Biaya Waste
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-rose-700">
                                Rp {wasteTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-slate-500">{waste.length} transaksi waste</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Low Margin Alert */}
                {lowMarginMenus.length > 0 && (
                    <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                            <TriangleAlert className="size-4" />
                            Menu dengan Margin di Bawah 60%
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {lowMarginMenus.map((m) => (
                                <Badge
                                    key={m.menu_id}
                                    variant="outline"
                                    className="border-amber-300 bg-white text-xs text-amber-800"
                                >
                                    {m.menu_name} ({m.margin_percent.toFixed(1)}%)
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Menu Engineering Quadrants */}
                <div className="mb-8">
                    <h2 className="mb-4 font-serif text-xl font-bold text-[#4F6B6A]">
                        Menu Engineering Matrix
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {quadrantMeta.map((q) => {
                            const menus = menuEngineering.quadrants[q.key];

                            return (
                                <Card
                                    key={q.key}
                                    className={`shadow-sm ${q.className}`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-serif text-lg font-bold text-slate-800">
                                                    {q.icon} {q.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 italic">
                                                    {q.desc}
                                                </p>
                                            </div>
                                            <Badge className={q.badge}>
                                                {menus?.length ?? 0}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {menus && menus.length > 0 ? (
                                            <ul className="space-y-1.5 text-sm">
                                                {menus.slice(0, 8).map((m) => (
                                                    <li
                                                        key={m.menu_id}
                                                        className="flex justify-between rounded-md bg-white/70 px-3 py-1.5"
                                                    >
                                                        <span className="text-slate-700">
                                                            {m.menu_name}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {m.qty_sold} terjual ·{' '}
                                                            {m.margin_percent.toFixed(1)}%
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">
                                                Tidak ada menu di kuadran ini.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-xs text-slate-400 italic">
                        Rata-rata popularitas:{' '}
                        {menuEngineering.averages.popularity} terjual · Rata-rata
                        margin: {menuEngineering.averages.margin}%
                    </p>
                </div>

                {/* Variance Table */}
                <div className="mb-8">
                    <h2 className="mb-4 font-serif text-xl font-bold text-[#4F6B6A]">
                        HPP Teoritis vs Aktual
                    </h2>
                    <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Menu
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Harga
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            HPP Teoritis
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            HPP Aktual
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Variance
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Margin
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variance.map((row) => (
                                        <tr
                                            key={row.menu_id}
                                            className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50"
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-slate-800">
                                                    {row.menu_name}
                                                </span>
                                                {row.category && (
                                                    <span className="block text-xs text-slate-400">
                                                        {row.category}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                Rp {row.price.toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                Rp{' '}
                                                {row.theoretical_hpp.toLocaleString(
                                                    'id-ID',
                                                    { maximumFractionDigits: 2 },
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                Rp{' '}
                                                {row.actual_hpp.toLocaleString('id-ID', {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right font-medium ${
                                                    row.variance > 0 ? 'text-rose-600' : 'text-emerald-600'
                                                }`}
                                            >
                                                {row.variance > 0 ? '+' : ''}
                                                {row.variance.toLocaleString('id-ID')} (
                                                {row.variance_percent.toFixed(1)}%)
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                {row.margin_percent.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {variance.length === 0 && (
                            <div className="py-16 text-center">
                                <h4 className="font-serif text-lg font-medium text-slate-700">
                                    Belum Ada Data
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 italic">
                                    Tambahkan resep ke menu dan catat penjualan
                                    untuk melihat analisis.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* COGS + Waste side by side */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* COGS */}
                    <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">
                                Tren COGS
                            </h3>
                            <Select
                                value={cogsPeriod}
                                onValueChange={(v) => setCogsPeriod(v)}
                            >
                                <SelectTrigger className="w-32 border-[#CFC0A4]/50 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    <SelectItem value="daily">Harian</SelectItem>
                                    <SelectItem value="weekly">Mingguan</SelectItem>
                                    <SelectItem value="monthly">Bulanan</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {cogs.details.slice(-10).map((d) => (
                                    <li
                                        key={d.period}
                                        className="flex items-center justify-between rounded-md bg-[#F6F2E9] px-3 py-2 text-sm"
                                    >
                                        <span className="text-slate-500">{d.period}</span>
                                        <span className="text-right">
                                            <span className="block font-medium text-slate-800">
                                                Rp {d.cogs.toLocaleString('id-ID')}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {d.cogs_percent}% dari penjualan
                                            </span>
                                        </span>
                                    </li>
                                ))}
                                {cogs.details.length === 0 && (
                                    <li className="py-8 text-center text-xs text-slate-500 italic">
                                        Belum ada data COGS pada periode ini.
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Waste */}
                    <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardHeader className="pb-3">
                            <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">
                                Riwayat Waste
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {waste.slice(-15).map((w, i) => (
                                    <li
                                        key={`${w.date}-${i}`}
                                        className="rounded-md bg-[#F6F2E9] px-3 py-2 text-sm"
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-700">
                                                {w.ingredient}
                                            </span>
                                            <span className="text-rose-600">
                                                -Rp {Math.abs(w.total_cost).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            {new Date(w.date).toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                            })}{' '}
                                            · {w.qty.toLocaleString('id-ID')} {w.unit}
                                            {w.notes && ` · ${w.notes}`}
                                        </p>
                                    </li>
                                ))}
                                {waste.length === 0 && (
                                    <li className="py-8 text-center text-xs text-slate-500 italic">
                                        Tidak ada waste pada periode ini. 🎉
                                    </li>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

HppReport.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'HPP & Profitabilitas', href: '/admin/reports/hpp' },
    ],
};

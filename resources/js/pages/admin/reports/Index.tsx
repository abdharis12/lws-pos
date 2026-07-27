import { Head, Link, router } from '@inertiajs/react';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, Clock, Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HourlyData {
    hour: string;
    count: number;
    total: number;
}

interface PaymentBreakdown {
    method: string;
    count: number;
    total: number;
}

interface TopMenu {
    id: number;
    name: string;
    total_qty: number;
    total_revenue: number;
}

interface Props {
    period: string;
    date: string;
    weekStart: string;
    month: string;
    totalSales: number;
    totalOrders: number;
    averageOrder: number;
    paymentBreakdown: PaymentBreakdown[];
    hourlyData: HourlyData[];
    topMenus: TopMenu[];
}

export default function ReportsIndex({
    period,
    date,
    weekStart,
    month,
    totalSales,
    totalOrders,
    averageOrder,
    paymentBreakdown,
    hourlyData,
    topMenus,
}: Props) {
    const maxHourlyCount = Math.max(1, ...hourlyData.map((h) => h.count));

    function switchPeriod(p: string) {
        router.get('/admin/reports', { period: p, date, weekStart, month }, { preserveState: true });
    }

    function exportReport() {
        window.open(`/admin/reports/export?period=${period}&date=${date}&format=xlsx`, '_blank');
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Laporan Penjualan" />

            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <FileText className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Analitik Penjualan</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Laporan Penjualan
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        {period === 'daily' ? `Harian — ${date}` : period === 'weekly' ? `Mingguan — ${weekStart}` : `Bulanan — ${month}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly'].map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => switchPeriod(p)}
                            className={period === p
                                ? 'bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)]'
                                : 'border-[oklch(0.80_0.038_88.5)]/40 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10'
                            }
                        >
                            {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportReport}
                        className="border-[oklch(0.80_0.038_88.5)]/40 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10"
                    >
                        <Download className="mr-1 size-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                Total Penjualan
                            </CardTitle>
                            <DollarSign className="size-4 text-[oklch(0.48_0.032_195.5)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-serif text-2xl font-bold text-[oklch(0.48_0.032_195.5)]">
                                Rp {Math.ceil(totalSales).toLocaleString('id-ID')}
                            </div>
                            <p className="mt-1 text-xs italic text-slate-500">
                                {period === 'daily' ? 'Hari ini' : period === 'weekly' ? 'Minggu ini' : 'Bulan ini'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                Total Order
                            </CardTitle>
                            <ShoppingCart className="size-4 text-[oklch(0.48_0.032_195.5)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-serif text-2xl font-bold text-[oklch(0.48_0.032_195.5)]">
                                {totalOrders}
                            </div>
                            <p className="mt-1 text-xs italic text-slate-500">
                                Transaksi
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                Rata-rata Order
                            </CardTitle>
                            <TrendingUp className="size-4 text-[oklch(0.48_0.032_195.5)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-serif text-2xl font-bold text-[oklch(0.48_0.032_195.5)]">
                                Rp {Math.ceil(averageOrder).toLocaleString('id-ID')}
                            </div>
                            <p className="mt-1 text-xs italic text-slate-500">
                                Per transaksi
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                Metode Bayar
                            </CardTitle>
                            <BarChart3 className="size-4 text-[oklch(0.48_0.032_195.5)]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {paymentBreakdown.length === 0 ? (
                                    <p className="text-xs italic text-slate-500">Belum ada data.</p>
                                ) : paymentBreakdown.map((p) => (
                                    <div key={p.method} className="flex items-center justify-between text-xs">
                                        <span className="capitalize text-slate-600">{p.method}</span>
                                        <span className="font-serif font-semibold text-slate-800">
                                            Rp {Math.ceil(p.total).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Hourly Chart */}
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                <Clock className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                                Jam Sibuk
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="flex items-end justify-between gap-1" style={{ height: 120 }}>
                                {hourlyData.map((h) => (
                                    <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                                        <div
                                            className="w-full rounded-t transition-all hover:opacity-80"
                                            style={{
                                                height: `${Math.max(4, (h.count / maxHourlyCount) * 100)}px`,
                                                backgroundColor: h.count > 0 ? 'oklch(0.48 0.032 195.5)' : 'oklch(0.48 0.032 195.5 / 0.08)',
                                            }}
                                            title={`${h.hour} — ${h.count} order (Rp ${Math.ceil(h.total).toLocaleString('id-ID')})`}
                                        />
                                        <span className="text-[10px] text-slate-400">
                                            {h.hour.slice(0, 2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Menus */}
                    <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                                <TrendingUp className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                                Menu Terlaris
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            {topMenus.length === 0 ? (
                                <p className="py-4 text-center text-sm italic text-slate-500">
                                    Belum ada data penjualan.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topMenus.map((menu, i) => (
                                        <div
                                            key={menu.id}
                                            className="flex items-center justify-between rounded-lg border border-[oklch(0.80_0.038_88.5)]/20 p-2.5 transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-6 items-center justify-center rounded-full bg-[oklch(0.48_0.032_195.5)]/10 text-xs font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                    {i + 1}
                                                </span>
                                                <span className="text-sm font-medium text-slate-800">
                                                    {menu.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-serif text-sm font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                    {menu.total_qty}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Rp {Math.ceil(menu.total_revenue).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Other Reports */}
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            Laporan Lainnya
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Link
                                href="/admin/reports/top-menus"
                                className="rounded-xl border border-[oklch(0.80_0.038_88.5)]/20 p-4 transition-all hover:border-[oklch(0.80_0.038_88.5)]/50 hover:shadow-md"
                            >
                                <p className="font-serif font-medium text-sm text-[oklch(0.48_0.032_195.5)]">Menu & Varian Terlaris</p>
                                <p className="mt-1 text-xs italic text-slate-500">Analisis menu dan topping/add-on terpopuler</p>
                            </Link>
                            <Link
                                href="/admin/reports/reconciliation"
                                className="rounded-xl border border-[oklch(0.80_0.038_88.5)]/20 p-4 transition-all hover:border-[oklch(0.80_0.038_88.5)]/50 hover:shadow-md"
                            >
                                <p className="font-serif font-medium text-sm text-[oklch(0.48_0.032_195.5)]">Rekonsiliasi Pembayaran</p>
                                <p className="mt-1 text-xs italic text-slate-500">Cocokkan QRIS vs sistem</p>
                            </Link>
                            <Link
                                href="/admin/reports/attendance"
                                className="rounded-xl border border-[oklch(0.80_0.038_88.5)]/20 p-4 transition-all hover:border-[oklch(0.80_0.038_88.5)]/50 hover:shadow-md"
                            >
                                <p className="font-serif font-medium text-sm text-[oklch(0.48_0.032_195.5)]">Kehadiran Karyawan</p>
                                <p className="mt-1 text-xs italic text-slate-500">Rekap absensi per periode</p>
                            </Link>
                            <Link
                                href="/admin/reports/overtime"
                                className="rounded-xl border border-[oklch(0.80_0.038_88.5)]/20 p-4 transition-all hover:border-[oklch(0.80_0.038_88.5)]/50 hover:shadow-md"
                            >
                                <p className="font-serif font-medium text-sm text-[oklch(0.48_0.032_195.5)]">Jam Lembur</p>
                                <p className="mt-1 text-xs italic text-slate-500">Perhitungan lembur per karyawan</p>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Penjualan', href: '/admin/reports' },
    ],
};

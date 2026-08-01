import { Head, Link, router } from '@inertiajs/react';
import {
    DollarSign,
    ShoppingCart,
    TrendingUp,
    BarChart3,
    Clock,
    Download,
    FileText,
} from 'lucide-react';

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
        router.get(
            '/admin/reports',
            { period: p, date, weekStart, month },
            { preserveState: true },
        );
    }

    function exportReport() {
        window.open(
            `/admin/reports/export?period=${period}&date=${date}&format=xlsx`,
            '_blank',
        );
    }

    return (
        <div className="min-h-screen bg-[#F6F2E9] p-6 font-sans text-slate-800">
            <Head title="Laporan Penjualan" />

            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                        <FileText className="size-3.5 text-[#4F6B6A]" />
                        <span>Analitik Penjualan</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                        Laporan Penjualan
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 italic">
                        {period === 'daily'
                            ? `Harian — ${date}`
                            : period === 'weekly'
                              ? `Mingguan — ${weekStart}`
                              : `Bulanan — ${month}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly'].map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => switchPeriod(p)}
                            className={
                                period === p
                                    ? 'bg-[#4F6B6A] text-white hover:bg-[#3B5655]'
                                    : 'border-[#CFC0A4]/40 text-[#4F6B6A] hover:bg-[#CFC0A4]/10'
                            }
                        >
                            {p === 'daily'
                                ? 'Harian'
                                : p === 'weekly'
                                  ? 'Mingguan'
                                  : 'Bulanan'}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={exportReport}
                        className="border-[#CFC0A4]/40 text-[#4F6B6A] hover:bg-[#CFC0A4]/10"
                    >
                        <Download className="mr-1 size-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                Total Penjualan
                            </CardTitle>
                            <DollarSign className="size-4 text-[#4F6B6A]" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp{' '}
                                {Math.ceil(totalSales).toLocaleString('id-ID')}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 italic">
                                {period === 'daily'
                                    ? 'Hari ini'
                                    : period === 'weekly'
                                      ? 'Minggu ini'
                                      : 'Bulan ini'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                Total Order
                            </CardTitle>
                            <ShoppingCart className="size-4 text-[#4F6B6A]" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-serif text-2xl font-bold text-[#4F6B6A]">
                                {totalOrders}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 italic">
                                Transaksi
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                Rata-rata Order
                            </CardTitle>
                            <TrendingUp className="size-4 text-[#4F6B6A]" />
                        </CardHeader>
                        <CardContent>
                            <div className="font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp{' '}
                                {Math.ceil(averageOrder).toLocaleString(
                                    'id-ID',
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 italic">
                                Per transaksi
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                Metode Bayar
                            </CardTitle>
                            <BarChart3 className="size-4 text-[#4F6B6A]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {paymentBreakdown.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">
                                        Belum ada data.
                                    </p>
                                ) : (
                                    paymentBreakdown.map((p) => (
                                        <div
                                            key={p.method}
                                            className="flex items-center justify-between text-xs"
                                        >
                                            <span className="text-slate-600 capitalize">
                                                {p.method}
                                            </span>
                                            <span className="font-serif font-semibold text-slate-800">
                                                Rp{' '}
                                                {Math.ceil(
                                                    p.total,
                                                ).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Hourly Chart */}
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                                <Clock className="size-5 text-[#CFC0A4]" />
                                Jam Sibuk
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div
                                className="flex items-end justify-between gap-1"
                                style={{ height: 120 }}
                            >
                                {hourlyData.map((h) => (
                                    <div
                                        key={h.hour}
                                        className="flex flex-1 flex-col items-center gap-1"
                                    >
                                        <div
                                            className="w-full rounded-t transition-all hover:opacity-80"
                                            style={{
                                                height: `${Math.max(4, (h.count / maxHourlyCount) * 100)}px`,
                                                backgroundColor:
                                                    h.count > 0
                                                        ? 'oklch(0.48 0.032 195.5)'
                                                        : 'oklch(0.48 0.032 195.5 / 0.08)',
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
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                                <TrendingUp className="size-5 text-[#CFC0A4]" />
                                Menu Terlaris
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            {topMenus.length === 0 ? (
                                <p className="py-4 text-center text-sm text-slate-500 italic">
                                    Belum ada data penjualan.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topMenus.map((menu, i) => (
                                        <div
                                            key={menu.id}
                                            className="flex items-center justify-between rounded-lg border border-[#CFC0A4]/20 p-2.5 transition-colors hover:bg-[#CFC0A4]/5"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-6 items-center justify-center rounded-full bg-[#4F6B6A]/10 text-xs font-semibold text-[#4F6B6A]">
                                                    {i + 1}
                                                </span>
                                                <span className="text-sm font-medium text-slate-800">
                                                    {menu.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-serif text-sm font-semibold text-[#4F6B6A]">
                                                    {menu.total_qty}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Rp{' '}
                                                    {Math.ceil(
                                                        menu.total_revenue,
                                                    ).toLocaleString('id-ID')}
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
                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="font-serif text-lg font-medium text-[#4F6B6A]">
                            Laporan Lainnya
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Link
                                href="/admin/reports/top-menus"
                                className="rounded-xl border border-[#CFC0A4]/20 p-4 transition-all hover:border-[#CFC0A4]/50 hover:shadow-md"
                            >
                                <p className="font-serif text-sm font-medium text-[#4F6B6A]">
                                    Menu & Varian Terlaris
                                </p>
                                <p className="mt-1 text-xs text-slate-500 italic">
                                    Analisis menu dan topping/add-on terpopuler
                                </p>
                            </Link>
                            <Link
                                href="/admin/reports/reconciliation"
                                className="rounded-xl border border-[#CFC0A4]/20 p-4 transition-all hover:border-[#CFC0A4]/50 hover:shadow-md"
                            >
                                <p className="font-serif text-sm font-medium text-[#4F6B6A]">
                                    Rekonsiliasi Pembayaran
                                </p>
                                <p className="mt-1 text-xs text-slate-500 italic">
                                    Cocokkan QRIS vs sistem
                                </p>
                            </Link>
                            <Link
                                href="/admin/reports/attendance"
                                className="rounded-xl border border-[#CFC0A4]/20 p-4 transition-all hover:border-[#CFC0A4]/50 hover:shadow-md"
                            >
                                <p className="font-serif text-sm font-medium text-[#4F6B6A]">
                                    Kehadiran Karyawan
                                </p>
                                <p className="mt-1 text-xs text-slate-500 italic">
                                    Rekap absensi per periode
                                </p>
                            </Link>
                            <Link
                                href="/admin/reports/overtime"
                                className="rounded-xl border border-[#CFC0A4]/20 p-4 transition-all hover:border-[#CFC0A4]/50 hover:shadow-md"
                            >
                                <p className="font-serif text-sm font-medium text-[#4F6B6A]">
                                    Jam Lembur
                                </p>
                                <p className="mt-1 text-xs text-slate-500 italic">
                                    Perhitungan lembur per karyawan
                                </p>
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

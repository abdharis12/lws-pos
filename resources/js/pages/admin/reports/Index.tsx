import { Head, Link, router } from '@inertiajs/react';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, Clock, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';
const SAND = '#CFC0A4';

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
        <>
            <Head title="Laporan Penjualan" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                            Laporan Penjualan
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
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
                                style={period === p ? { backgroundColor: PRIMARY } : {}}
                            >
                                {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
                            </Button>
                        ))}
                        <Button variant="outline" size="sm" onClick={exportReport}>
                            <Download className="mr-1 size-4" />
                            Export
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Total Penjualan
                            </CardTitle>
                            <DollarSign className="size-4" style={{ color: PRIMARY }} />
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-2xl font-bold" style={{ color: DARK }}>
                                Rp {totalSales.toLocaleString('id-ID')}
                            </div>
                            <p className="mt-1 text-xs" style={{ color: '#8a968f' }}>
                                {period === 'daily' ? 'Hari ini' : period === 'weekly' ? 'Minggu ini' : 'Bulan ini'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Total Order
                            </CardTitle>
                            <ShoppingCart className="size-4" style={{ color: PRIMARY }} />
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-2xl font-bold" style={{ color: DARK }}>
                                {totalOrders}
                            </div>
                            <p className="mt-1 text-xs" style={{ color: '#8a968f' }}>
                                Transaksi
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Rata-rata Order
                            </CardTitle>
                            <TrendingUp className="size-4" style={{ color: PRIMARY }} />
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-2xl font-bold" style={{ color: DARK }}>
                                Rp {averageOrder.toLocaleString('id-ID')}
                            </div>
                            <p className="mt-1 text-xs" style={{ color: '#8a968f' }}>
                                Per transaksi
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Metode Bayar
                            </CardTitle>
                            <BarChart3 className="size-4" style={{ color: PRIMARY }} />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {paymentBreakdown.length === 0 ? (
                                    <p className="text-xs" style={{ color: '#8a968f' }}>Belum ada data.</p>
                                ) : paymentBreakdown.map((p) => (
                                    <div key={p.method} className="flex items-center justify-between text-xs">
                                        <span style={{ color: '#5c6a66' }} className="capitalize">{p.method}</span>
                                        <span className="font-semibold" style={{ color: DARK }}>
                                            Rp {p.total.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                                <Clock className="size-5" style={{ color: PRIMARY }} />
                                Jam Sibuk
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between gap-1" style={{ height: 120 }}>
                                {hourlyData.map((h) => (
                                    <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                                        <div
                                            className="w-full rounded-t transition-all hover:opacity-80"
                                            style={{
                                                height: `${Math.max(4, (h.count / maxHourlyCount) * 100)}px`,
                                                backgroundColor: h.count > 0 ? PRIMARY : 'rgba(79,107,106,0.08)',
                                            }}
                                            title={`${h.hour} — ${h.count} order (Rp ${h.total.toLocaleString('id-ID')})`}
                                        />
                                        <span className="text-[10px]" style={{ color: '#8a968f' }}>
                                            {h.hour.slice(0, 2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                                <TrendingUp className="size-5" style={{ color: PRIMARY }} />
                                Menu Terlaris
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topMenus.length === 0 ? (
                                <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                                    Belum ada data penjualan.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topMenus.map((menu, i) => (
                                        <div key={menu.id} className="flex items-center justify-between rounded-lg border p-2.5 transition-colors hover:bg-[#F6F2E9]/50" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-6 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(79,107,106,0.12)', color: PRIMARY }}>
                                                    {i + 1}
                                                </span>
                                                <span className="text-sm font-medium" style={{ color: DARK }}>
                                                    {menu.name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold" style={{ color: DARK }}>
                                                    {menu.total_qty}
                                                </p>
                                                <p className="text-xs" style={{ color: '#8a968f' }}>
                                                    Rp {menu.total_revenue.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                            Laporan Lainnya
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Link href="/admin/reports/top-menus" className="rounded-xl border p-4 transition-all hover:shadow-md" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                                <p className="font-medium text-sm" style={{ color: DARK }}>Menu & Varian Terlaris</p>
                                <p className="mt-1 text-xs" style={{ color: '#8a968f' }}>Analisis menu dan topping/add-on terpopuler</p>
                            </Link>
                            <Link href="/admin/reports/reconciliation" className="rounded-xl border p-4 transition-all hover:shadow-md" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                                <p className="font-medium text-sm" style={{ color: DARK }}>Rekonsiliasi Pembayaran</p>
                                <p className="mt-1 text-xs" style={{ color: '#8a968f' }}>Cocokkan QRIS vs sistem</p>
                            </Link>
                            <Link href="/admin/reports/attendance" className="rounded-xl border p-4 transition-all hover:shadow-md" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                                <p className="font-medium text-sm" style={{ color: DARK }}>Kehadiran Karyawan</p>
                                <p className="mt-1 text-xs" style={{ color: '#8a968f' }}>Rekap absensi per periode</p>
                            </Link>
                            <Link href="/admin/reports/overtime" className="rounded-xl border p-4 transition-all hover:shadow-md" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                                <p className="font-medium text-sm" style={{ color: DARK }}>Jam Lembur</p>
                                <p className="mt-1 text-xs" style={{ color: '#8a968f' }}>Perhitungan lembur per karyawan</p>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Penjualan', href: '/admin/reports' },
    ],
};

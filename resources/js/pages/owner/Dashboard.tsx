import { Head } from '@inertiajs/react';
import { DollarSign, ShoppingCart, TrendingUp, Users, ChefHat, Clock, CreditCard, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActiveOrder {
    id: number;
    table_code: string;
    status: string;
    items_count: number;
    created_at: string;
}

interface TopMenu {
    name: string;
    total_qty: number;
}

interface PaymentSummary {
    method: string;
    count: number;
    total: number;
}

interface SalesTrend {
    date: string;
    total: number;
}

interface Props {
    avgCookingTime: number | null;
    todaySales: number;
    todayOrdersCount: number;
    yesterdaySales: number;
    thisWeekSales: number;
    lastWeekSales: number;
    salesGrowth: number;
    grossProfit: number;
    laborCost: number;
    employeeCount: number;
    attendanceToday: number;
    activeOrders: ActiveOrder[];
    topMenus: TopMenu[];
    paymentSummary: PaymentSummary[];
    salesTrend: SalesTrend[];
}

export default function OwnerDashboard({
    avgCookingTime,
    todaySales,
    todayOrdersCount,
    yesterdaySales,
    thisWeekSales,
    lastWeekSales,
    salesGrowth,
    grossProfit,
    laborCost,
    employeeCount,
    attendanceToday,
    activeOrders,
    topMenus,
    paymentSummary,
    salesTrend,
}: Props) {
    const maxTrend = Math.max(1, ...salesTrend.map((d) => d.total));

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Dashboard Owner" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <DollarSign className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Dashboard Owner</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Dashboard Owner
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Ringkasan operasional & keuangan
                    </p>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <Card className="group relative overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Penjualan Hari Ini</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">
                                    Rp {todaySales.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-slate-400">{todayOrdersCount} transaksi</p>
                                {salesGrowth !== undefined && (
                                    <p className={`flex items-center gap-1 text-xs font-semibold ${salesGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {salesGrowth >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                                        {salesGrowth}% vs kemarin
                                    </p>
                                )}
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.48_0.032_195.5)] text-white transition-transform duration-300 group-hover:scale-110">
                                <DollarSign className="size-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Estimasi Laba Kotor</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">
                                    Rp {grossProfit.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-slate-400">60% dari penjualan</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.48_0.032_195.5)] text-white transition-transform duration-300 group-hover:scale-110">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Estimasi Labor Cost</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">
                                    Rp {laborCost.toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-slate-400">25% dari penjualan</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.48_0.032_195.5)] text-white transition-transform duration-300 group-hover:scale-110">
                                <Users className="size-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Kehadiran Karyawan</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">
                                    {attendanceToday}/{employeeCount}
                                </p>
                                <p className="text-xs text-slate-400">Hadir hari ini</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.48_0.032_195.5)] text-white transition-transform duration-300 group-hover:scale-110">
                                <Clock className="size-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Rata-rata Waktu Masak</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">
                                    {avgCookingTime ? `${avgCookingTime} mnt` : '-'}
                                </p>
                                <p className="text-xs text-slate-400">Dari order selesai hari ini</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.48_0.032_195.5)] text-white transition-transform duration-300 group-hover:scale-110">
                                <ChefHat className="size-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            <TrendingUp className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                            Tren Penjualan 7 Hari
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
                            {salesTrend.map((d) => (
                                <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                                    <span className={`text-xs font-semibold ${d.total > 0 ? 'text-[oklch(0.48_0.032_195.5)]' : 'text-slate-400'}`}>
                                        Rp {(d.total / 1000).toFixed(0)}k
                                    </span>
                                    <div
                                        className="w-full rounded-t transition-all hover:opacity-80"
                                        style={{
                                            height: `${Math.max(4, (d.total / maxTrend) * 120)}px`,
                                            backgroundColor: d.total > 0 ? 'oklch(0.48 0.032 195.5)' : 'oklch(0.48 0.032 195.5 / 0.08)',
                                        }}
                                    />
                                    <span className="text-xs text-slate-400">{d.date}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                            <div className="rounded-lg border border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 p-4">
                                <p className="text-xs text-slate-500">Minggu Ini</p>
                                <p className="mt-1 font-serif text-lg font-bold text-slate-800">
                                    Rp {thisWeekSales.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="rounded-lg border border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 p-4">
                                <p className="text-xs text-slate-500">Minggu Lalu</p>
                                <p className="mt-1 font-serif text-lg font-bold text-slate-800">
                                    Rp {lastWeekSales.toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            <CreditCard className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                            Metode Bayar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {paymentSummary.length === 0 ? (
                            <p className="py-8 text-center text-sm italic text-slate-500">Belum ada transaksi</p>
                        ) : (
                            <div className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                {paymentSummary.map((p) => (
                                    <div key={p.method} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                        <span className="text-sm capitalize text-slate-500">{p.method}</span>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-800">
                                                Rp {p.total.toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-xs text-slate-400">{p.count} transaksi</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            <ChefHat className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                            Order Aktif
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activeOrders.length === 0 ? (
                            <p className="py-8 text-center text-sm italic text-slate-500">Tidak ada order aktif.</p>
                        ) : (
                            <div className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                {activeOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-800">Meja {order.table_code}</span>
                                            <Badge variant="outline" className="border-[oklch(0.80_0.038_88.5)]/30 text-[11px] text-[oklch(0.48_0.032_195.5)]">
                                                {order.items_count} item
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">{order.created_at}</span>
                                            <Badge className={`border-none font-semibold ${order.status === 'paid' ? 'bg-[oklch(0.80_0.038_88.5)]/20 text-[oklch(0.80_0.038_88.5)]' : 'bg-[oklch(0.48_0.032_195.5)]/12 text-[oklch(0.48_0.032_195.5)]'}`}>
                                                {order.status === 'paid' ? 'Baru' : 'Diproses'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            <TrendingUp className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                            Menu Terlaris Hari Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topMenus.length === 0 ? (
                            <p className="py-8 text-center text-sm italic text-slate-500">Belum ada data penjualan.</p>
                        ) : (
                            <div className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                {topMenus.map((menu, i) => (
                                    <div key={menu.name} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-7 items-center justify-center rounded-full bg-[oklch(0.48_0.032_195.5)]/10 text-xs font-bold text-[oklch(0.48_0.032_195.5)]">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm font-medium text-slate-800">{menu.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-800">{menu.total_qty}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

OwnerDashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Dashboard Owner', href: '/owner/dashboard' },
    ],
};

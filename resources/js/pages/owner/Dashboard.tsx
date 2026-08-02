import { Head } from '@inertiajs/react';
import {
    DollarSign,
    TrendingUp,
    Users,
    ChefHat,
    Clock,
    CreditCard,
    ArrowUp,
    ArrowDown,
    Coins,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

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
    monthlyRounding: number;
    lastMonthRounding: number;
    roundingGrowth: number;
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
    thisWeekSales,
    lastWeekSales,
    salesGrowth,
    grossProfit,
    laborCost,
    monthlyRounding,
    lastMonthRounding,
    roundingGrowth,
    employeeCount,
    attendanceToday,
    activeOrders,
    topMenus,
    paymentSummary,
    salesTrend,
}: Props) {
    const maxTrend = Math.max(1, ...salesTrend.map((d) => d.total));

    return (
        <div className="min-h-screen bg-[#F6F2E9] p-6 font-sans text-slate-800">
            <Head title="Dashboard Owner" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                        <DollarSign className="size-3.5 text-[#4F6B6A]" />
                        <span>Dashboard Owner</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                        Dashboard Owner
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 italic">
                        Ringkasan operasional & keuangan
                    </p>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Penjualan Hari Ini
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <DollarSign
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-2xl font-bold tracking-tight text-[#4F6B6A]">
                            Rp {todaySales.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            {todayOrdersCount} transaksi
                        </p>
                        {salesGrowth !== undefined && (
                            <p
                                className={`mt-1 flex items-center gap-1 text-xs font-semibold ${salesGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                                {salesGrowth >= 0 ? (
                                    <ArrowUp className="size-3" />
                                ) : (
                                    <ArrowDown className="size-3" />
                                )}
                                {salesGrowth}% vs kemarin
                            </p>
                        )}
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#CFC0A4] to-[#4F6B6A]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Estimasi Laba Kotor
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <TrendingUp
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-2xl font-bold tracking-tight text-[#4F6B6A]">
                            Rp {grossProfit.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            60% dari penjualan
                        </p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Estimasi Labor Cost
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <Users
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-2xl font-bold tracking-tight text-[#4F6B6A]">
                            Rp {laborCost.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            25% dari penjualan
                        </p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#CFC0A4] to-[#4F6B6A]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Pendapatan Pembulatan
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <Coins
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-2xl font-bold tracking-tight text-[#4F6B6A]">
                            Rp {monthlyRounding.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            Akumulasi bulan ini
                        </p>
                        {lastMonthRounding > 0 && (
                            <p
                                className={`mt-1 flex items-center gap-1 text-xs font-semibold ${roundingGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                                {roundingGrowth >= 0 ? (
                                    <ArrowUp className="size-3" />
                                ) : (
                                    <ArrowDown className="size-3" />
                                )}
                                {Math.abs(roundingGrowth)}% vs bulan lalu
                            </p>
                        )}
                        <p className="mt-1 text-[10px] italic text-slate-400">
                            Pendapatan lain-lain
                        </p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-[#4F6B6A]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Kehadiran Karyawan
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <Clock
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-4xl font-bold tracking-tight text-[#4F6B6A]">
                            {attendanceToday}/{employeeCount}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            Hadir hari ini
                        </p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#CFC0A4] to-[#4F6B6A]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Rata-rata Waktu Masak
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <ChefHat
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-2xl font-bold tracking-tight text-[#4F6B6A]">
                            {avgCookingTime ? `${avgCookingTime} mnt` : '-'}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            Dari order selesai hari ini
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-3">
                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm lg:col-span-2">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                            <TrendingUp className="size-5 text-[#CFC0A4]" />
                            Tren Penjualan 7 Hari
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div
                            className="flex items-end justify-between gap-2"
                            style={{ height: 160 }}
                        >
                            {salesTrend.map((d) => (
                                <div
                                    key={d.date}
                                    className="flex flex-1 flex-col items-center gap-2"
                                >
                                    <span
                                        className={`text-xs font-semibold ${d.total > 0 ? 'text-[#4F6B6A]' : 'text-slate-400'}`}
                                    >
                                        Rp {(d.total / 1000).toFixed(0)}k
                                    </span>
                                    <div
                                        className="w-full rounded-t transition-all hover:opacity-80"
                                        style={{
                                            height: `${Math.max(4, (d.total / maxTrend) * 120)}px`,
                                            backgroundColor:
                                                d.total > 0 ? INK : INK_LIGHT,
                                        }}
                                    />
                                    <span className="text-xs text-slate-400">
                                        {d.date}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                            <div className="rounded-lg border border-[#CFC0A4]/20 bg-[#4F6B6A]/5 p-4">
                                <p className="text-xs text-slate-500">
                                    Minggu Ini
                                </p>
                                <p className="mt-1 font-serif text-lg font-bold text-slate-800">
                                    Rp {thisWeekSales.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <div className="rounded-lg border border-[#CFC0A4]/20 bg-[#4F6B6A]/5 p-4">
                                <p className="text-xs text-slate-500">
                                    Minggu Lalu
                                </p>
                                <p className="mt-1 font-serif text-lg font-bold text-slate-800">
                                    Rp {lastWeekSales.toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                            <CreditCard className="size-5 text-[#CFC0A4]" />
                            Metode Bayar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {paymentSummary.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <div
                                    className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: INK_LIGHT }}
                                >
                                    <CreditCard
                                        className="size-8"
                                        style={{ color: INK }}
                                    />
                                </div>
                                <h3
                                    className="font-serif text-xl font-bold"
                                    style={{ color: INK }}
                                >
                                    Belum Ada Transaksi
                                </h3>
                                <p
                                    className="mt-1 max-w-sm text-sm"
                                    style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                >
                                    Belum ada transaksi pembayaran pada periode
                                    ini.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#CFC0A4]/15">
                                {paymentSummary.map((p) => (
                                    <div
                                        key={p.method}
                                        className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <span className="text-sm text-slate-500 capitalize">
                                            {p.method}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-800">
                                                Rp{' '}
                                                {p.total.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {p.count} transaksi
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                            <ChefHat className="size-5 text-[#CFC0A4]" />
                            Order Aktif
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activeOrders.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <div
                                    className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: INK_LIGHT }}
                                >
                                    <ChefHat
                                        className="size-8"
                                        style={{ color: INK }}
                                    />
                                </div>
                                <h3
                                    className="font-serif text-xl font-bold"
                                    style={{ color: INK }}
                                >
                                    Belum Ada Order Aktif
                                </h3>
                                <p
                                    className="mt-1 max-w-sm text-sm"
                                    style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                >
                                    Tidak ada order yang sedang berlangsung.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#CFC0A4]/15">
                                {activeOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-800">
                                                Meja {order.table_code}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="border-[#CFC0A4]/30 text-[11px] text-[#4F6B6A]"
                                            >
                                                {order.items_count} item
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">
                                                {order.created_at}
                                            </span>
                                            <Badge
                                                className={`border-none font-semibold ${order.status === 'paid' ? 'bg-[#CFC0A4]/20 text-[#CFC0A4]' : 'bg-[#4F6B6A]/12 text-[#4F6B6A]'}`}
                                            >
                                                {order.status === 'paid'
                                                    ? 'Baru'
                                                    : 'Diproses'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                            <TrendingUp className="size-5 text-[#CFC0A4]" />
                            Menu Terlaris Hari Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topMenus.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <div
                                    className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: INK_LIGHT }}
                                >
                                    <TrendingUp
                                        className="size-8"
                                        style={{ color: INK }}
                                    />
                                </div>
                                <h3
                                    className="font-serif text-xl font-bold"
                                    style={{ color: INK }}
                                >
                                    Belum Ada Data
                                </h3>
                                <p
                                    className="mt-1 max-w-sm text-sm"
                                    style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                >
                                    Belum ada penjualan menu hari ini.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#CFC0A4]/15">
                                {topMenus.map((menu, i) => (
                                    <div
                                        key={menu.name}
                                        className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-7 items-center justify-center rounded-full bg-[#4F6B6A]/10 text-xs font-bold text-[#4F6B6A]">
                                                {i + 1}
                                            </span>
                                            <span className="text-sm font-medium text-slate-800">
                                                {menu.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-800">
                                            {menu.total_qty}
                                        </span>
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

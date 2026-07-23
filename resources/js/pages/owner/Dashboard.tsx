import { Head, usePage } from '@inertiajs/react';
import { DollarSign, ShoppingCart, TrendingUp, Users, ChefHat, Clock, CreditCard, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';
const SAND = '#CFC0A4';

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

function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, trendUp }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: typeof DollarSign;
    trend?: number;
    trendLabel?: string;
    trendUp?: boolean;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#5c6a66' }}>
                        {title}
                    </p>
                    <p className="font-display text-2xl font-bold tracking-tight" style={{ color: DARK }}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs" style={{ color: '#8a968f' }}>
                            {subtitle}
                        </p>
                    )}
                    {trend !== undefined && (
                        <p className={`flex items-center gap-1 text-xs font-semibold ${trendUp !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                            {trendUp !== false ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                            {trend}% {trendLabel || 'vs kemarin'}
                        </p>
                    )}
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: PRIMARY, color: '#FAF8F5' }}>
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

export default function OwnerDashboard({
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
        <>
            <Head title="Dashboard Owner" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                        Dashboard Owner
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                        Ringkasan operasional & keuangan
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Penjualan Hari Ini"
                        value={`Rp ${todaySales.toLocaleString('id-ID')}`}
                        subtitle={`${todayOrdersCount} transaksi`}
                        icon={DollarSign}
                        trend={salesGrowth}
                    />
                    <StatCard
                        title="Estimasi Laba Kotor"
                        value={`Rp ${grossProfit.toLocaleString('id-ID')}`}
                        subtitle="60% dari penjualan"
                        icon={TrendingUp}
                    />
                    <StatCard
                        title="Estimasi Labor Cost"
                        value={`Rp ${laborCost.toLocaleString('id-ID')}`}
                        subtitle="25% dari penjualan"
                        icon={Users}
                    />
                    <StatCard
                        title="Kehadiran Karyawan"
                        value={`${attendanceToday}/${employeeCount}`}
                        subtitle="Hadir hari ini"
                        icon={Clock}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                                <TrendingUp className="size-5" style={{ color: PRIMARY }} />
                                Tren Penjualan 7 Hari
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
                                {salesTrend.map((d) => (
                                    <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                                        <span className="text-xs font-semibold" style={{ color: d.total > 0 ? PRIMARY : '#8a968f' }}>
                                            Rp {(d.total / 1000).toFixed(0)}k
                                        </span>
                                        <div
                                            className="w-full rounded-t transition-all hover:opacity-80"
                                            style={{
                                                height: `${Math.max(4, (d.total / maxTrend) * 120)}px`,
                                                backgroundColor: d.total > 0 ? PRIMARY : 'rgba(79,107,106,0.08)',
                                            }}
                                        />
                                        <span className="text-xs" style={{ color: '#8a968f' }}>
                                            {d.date}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                                <div className="rounded-lg border p-3" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                                    <p className="text-xs" style={{ color: '#8a968f' }}>Minggu Ini</p>
                                    <p className="font-display text-lg font-bold" style={{ color: DARK }}>
                                        Rp {thisWeekSales.toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                                    <p className="text-xs" style={{ color: '#8a968f' }}>Minggu Lalu</p>
                                    <p className="font-display text-lg font-bold" style={{ color: DARK }}>
                                        Rp {lastWeekSales.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                                <CreditCard className="size-5" style={{ color: PRIMARY }} />
                                Metode Bayar
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {paymentSummary.length === 0 ? (
                                <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>Belum ada transaksi</p>
                            ) : (
                                <div className="space-y-3">
                                    {paymentSummary.map((p) => (
                                        <div key={p.method} className="flex items-center justify-between">
                                            <span className="text-sm capitalize" style={{ color: '#5c6a66' }}>{p.method}</span>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold" style={{ color: DARK }}>
                                                    Rp {p.total.toLocaleString('id-ID')}
                                                </p>
                                                <p className="text-xs" style={{ color: '#8a968f' }}>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                                <ChefHat className="size-5" style={{ color: PRIMARY }} />
                                Order Aktif
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeOrders.length === 0 ? (
                                <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                                    Tidak ada order aktif.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {activeOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm" style={{ color: DARK }}>
                                                    Meja {order.table_code}
                                                </span>
                                                <Badge variant="outline" className="text-[11px]" style={{ borderColor: SAND, color: PRIMARY }}>
                                                    {order.items_count} item
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs" style={{ color: '#8a968f' }}>{order.created_at}</span>
                                                <Badge className="font-semibold border-none" style={{
                                                    backgroundColor: order.status === 'paid' ? 'rgba(207,192,164,0.2)' : 'rgba(79,107,106,0.12)',
                                                    color: order.status === 'paid' ? SAND : PRIMARY,
                                                }}>
                                                    {order.status === 'paid' ? 'Baru' : 'Diproses'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                                <TrendingUp className="size-5" style={{ color: PRIMARY }} />
                                Menu Terlaris Hari Ini
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
                                        <div key={menu.name} className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-6 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(79,107,106,0.12)', color: PRIMARY }}>
                                                    {i + 1}
                                                </span>
                                                <span className="text-sm font-medium" style={{ color: DARK }}>
                                                    {menu.name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold" style={{ color: DARK }}>
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
        </>
    );
}

OwnerDashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Dashboard Owner', href: '/owner/dashboard' },
    ],
};

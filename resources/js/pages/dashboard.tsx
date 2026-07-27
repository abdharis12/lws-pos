import { Head } from '@inertiajs/react';
import { DollarSign, ShoppingCart, TrendingUp, ChefHat, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

interface TopMenu {
    id: number;
    name: string;
    total_qty: number;
    total_revenue: number;
}

interface ActiveOrder {
    id: number;
    table_code: string;
    status: string;
    items_count: number;
    created_at: string;
}

interface EmployeeAttendance {
    id: number;
    name: string;
    position: string;
    clock_in: string | null;
    status: string;
}

interface Props {
    todaySales?: number;
    todayOrdersCount?: number;
    topMenus?: TopMenu[];
    activeOrders?: ActiveOrder[];
    todayAttendances?: EmployeeAttendance[];
}

export default function Dashboard({
    todaySales = 0,
    todayOrdersCount = 0,
    topMenus = [],
    activeOrders = [],
    todayAttendances = [],
}: Props) {
    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Dashboard" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <DollarSign className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Dashboard</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Ringkasan operasional restoran
                    </p>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="group relative overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Penjualan Hari Ini</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">
                                    Rp {Number(todaySales).toLocaleString('id-ID')}
                                </p>
                                <p className="text-xs text-slate-400">Total pendapatan hari ini</p>
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
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Order Hari Ini</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">{todayOrdersCount}</p>
                                <p className="text-xs text-slate-400">Jumlah order hari ini</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.48_0.032_195.5)] text-white transition-transform duration-300 group-hover:scale-110">
                                <ShoppingCart className="size-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Menu Terlaris</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">
                                    {topMenus.length > 0 ? topMenus[0].name : '-'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {topMenus.length > 0 ? `${topMenus[0].total_qty} terjual hari ini` : 'Belum ada data'}
                                </p>
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
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Karyawan Hadir</p>
                                <p className="font-serif text-2xl font-bold tracking-tight text-slate-800">
                                    {todayAttendances.filter((a) => a.clock_in).length}
                                </p>
                                <p className="text-xs text-slate-400">Dari {todayAttendances.length} karyawan</p>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-xl bg-[oklch(0.48_0.032_195.5)] text-white transition-transform duration-300 group-hover:scale-110">
                                <Users className="size-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                            <ChefHat className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                            Order Aktif di Dapur
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activeOrders.length === 0 ? (
                            <p className="py-8 text-center text-sm italic text-slate-500">Tidak ada order aktif.</p>
                        ) : (
                            <div className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                {activeOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-800">Meja {order.table_code}</span>
                                                <Badge variant="outline" className="border-[oklch(0.80_0.038_88.5)]/30 text-[11px] text-[oklch(0.48_0.032_195.5)]">
                                                    {order.items_count} item
                                                </Badge>
                                            </div>
                                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="size-3" />
                                                {order.created_at}
                                            </p>
                                        </div>
                                        <Badge className={`border-none font-semibold ${order.status === 'pending' ? 'bg-[oklch(0.80_0.038_88.5)]/20 text-[oklch(0.80_0.038_88.5)]' : 'bg-[oklch(0.48_0.032_195.5)]/12 text-[oklch(0.48_0.032_195.5)]'}`}>
                                            {order.status === 'pending' ? 'Menunggu' : 'Diproses'}
                                        </Badge>
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
                                    <div key={menu.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-7 items-center justify-center rounded-full bg-[oklch(0.48_0.032_195.5)]/10 text-xs font-bold text-[oklch(0.48_0.032_195.5)]">
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-slate-800">{menu.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-800">{menu.total_qty}</p>
                                            <p className="text-xs text-slate-400">
                                                Rp {Number(menu.total_revenue).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                        <Users className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                        Kehadiran Karyawan Hari Ini
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {todayAttendances.length === 0 ? (
                        <p className="py-8 text-center text-sm italic text-slate-500">Belum ada data kehadiran.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                        <th className="px-6 py-3.5 font-semibold">Nama</th>
                                        <th className="px-6 py-3.5 font-semibold">Posisi</th>
                                        <th className="px-6 py-3.5 font-semibold">Jam Masuk</th>
                                        <th className="px-6 py-3.5 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                    {todayAttendances.map((att) => (
                                        <tr key={att.id} className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5">
                                            <td className="px-6 py-4 font-medium text-slate-800">{att.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{att.position}</td>
                                            <td className="px-6 py-4 text-slate-500">{att.clock_in || '-'}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={`border-none font-semibold ${att.clock_in ? 'bg-[oklch(0.48_0.032_195.5)]/12 text-[oklch(0.48_0.032_195.5)]' : 'bg-[oklch(0.80_0.038_88.5)]/20 text-[oklch(0.80_0.038_88.5)]'}`}>
                                                    {att.clock_in ? 'Hadir' : 'Belum Absen'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};

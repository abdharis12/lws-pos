import { Head } from '@inertiajs/react';
import {
    DollarSign,
    ShoppingCart,
    TrendingUp,
    ChefHat,
    Users,
    Clock,
    Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

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
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Dashboard" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                        <Layers className="size-3.5 text-[#4F6B6A]" />
                        <span>Dashboard</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 italic">
                        Ringkasan operasional restoran
                    </p>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                            Rp {Number(todaySales).toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            Total pendapatan hari ini
                        </p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#CFC0A4] to-[#4F6B6A]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Order Hari Ini
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <ShoppingCart
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-4xl font-bold tracking-tight text-[#4F6B6A]">
                            {todayOrdersCount}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            Jumlah order hari ini
                        </p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Menu Terlaris
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <TrendingUp
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-xl font-bold tracking-tight text-[#4F6B6A]">
                            {topMenus.length > 0 ? topMenus[0].name : '-'}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            {topMenus.length > 0
                                ? `${topMenus[0].total_qty} terjual hari ini`
                                : 'Belum ada data'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-[#4F6B6A]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Karyawan Hadir
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
                            <Users
                                className="h-4.5 w-4.5 text-[#4F6B6A]"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="font-serif text-4xl font-bold tracking-tight text-[#4F6B6A]">
                            {todayAttendances.filter((a) => a.clock_in).length}
                        </p>
                        <p className="mt-1.5 text-xs text-slate-500">
                            Dari {todayAttendances.length} karyawan
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                            <ChefHat className="size-5 text-[#CFC0A4]" />
                            Order Aktif di Dapur
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
                                    Tidak ada order yang sedang diproses dapur.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#CFC0A4]/15">
                                {activeOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-800">
                                                    Meja {order.table_code}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="border-[#CFC0A4]/30 text-[11px] text-[#4F6B6A]"
                                                >
                                                    {order.items_count} item
                                                </Badge>
                                            </div>
                                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                                <Clock className="size-3" />
                                                {order.created_at}
                                            </p>
                                        </div>
                                        <Badge
                                            className={`border-none font-semibold ${order.status === 'pending' ? 'bg-[#CFC0A4]/20 text-[#CFC0A4]' : 'bg-[#4F6B6A]/12 text-[#4F6B6A]'}`}
                                        >
                                            {order.status === 'pending'
                                                ? 'Menunggu'
                                                : 'Diproses'}
                                        </Badge>
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
                                        key={menu.id}
                                        className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-[#CFC0A4]/5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-7 items-center justify-center rounded-full bg-[#4F6B6A]/10 text-xs font-bold text-[#4F6B6A]">
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-slate-800">
                                                {menu.name}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {menu.total_qty}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Rp{' '}
                                                {Number(
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

            <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[#CFC0A4]/20">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                        <Users className="size-5 text-[#CFC0A4]" />
                        Kehadiran Karyawan Hari Ini
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {todayAttendances.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-12 text-center">
                            <div
                                className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                style={{ backgroundColor: INK_LIGHT }}
                            >
                                <Users
                                    className="size-8"
                                    style={{ color: INK }}
                                />
                            </div>
                            <h3
                                className="font-serif text-xl font-bold"
                                style={{ color: INK }}
                            >
                                Belum Ada Kehadiran
                            </h3>
                            <p
                                className="mt-1 max-w-sm text-sm"
                                style={{ color: 'oklch(0.60 0.03 88.5)' }}
                            >
                                Belum ada karyawan yang melakukan absensi hari
                                ini.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                        <th className="px-6 py-3.5 font-semibold">
                                            Nama
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Posisi
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Jam Masuk
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#CFC0A4]/15">
                                    {todayAttendances.map((att) => (
                                        <tr
                                            key={att.id}
                                            className="transition-colors hover:bg-[#CFC0A4]/5"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {att.name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {att.position}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {att.clock_in || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    className={`border-none font-semibold ${att.clock_in ? 'bg-[#4F6B6A]/12 text-[#4F6B6A]' : 'bg-[#CFC0A4]/20 text-[#CFC0A4]'}`}
                                                >
                                                    {att.clock_in
                                                        ? 'Hadir'
                                                        : 'Belum Absen'}
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

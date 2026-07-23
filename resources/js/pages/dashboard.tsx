import { Head } from '@inertiajs/react';
import { DollarSign, ShoppingCart, TrendingUp, ChefHat, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { dashboard } from '@/routes';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';
const SAND = '#CFC0A4';

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

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: typeof DollarSign;
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
                    <p className="text-xs" style={{ color: '#8a968f' }}>
                        {subtitle}
                    </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: PRIMARY, color: '#FAF8F5' }}>
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({
    todaySales = 0,
    todayOrdersCount = 0,
    topMenus = [],
    activeOrders = [],
    todayAttendances = [],
}: Props) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div>
                    <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                        Ringkasan operasional restoran
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Penjualan Hari Ini"
                        value={`Rp ${Number(todaySales).toLocaleString('id-ID')}`}
                        subtitle="Total pendapatan hari ini"
                        icon={DollarSign}
                    />
                    <StatCard
                        title="Order Hari Ini"
                        value={todayOrdersCount}
                        subtitle="Jumlah order hari ini"
                        icon={ShoppingCart}
                    />
                    <StatCard
                        title="Menu Terlaris"
                        value={topMenus.length > 0 ? topMenus[0].name : '-'}
                        subtitle={topMenus.length > 0 ? `${topMenus[0].total_qty} terjual hari ini` : 'Belum ada data'}
                        icon={TrendingUp}
                    />
                    <StatCard
                        title="Karyawan Hadir"
                        value={todayAttendances.filter((a) => a.clock_in).length}
                        subtitle={`Dari ${todayAttendances.length} karyawan`}
                        icon={Users}
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                        <div className="mb-4 flex items-center gap-2">
                            <ChefHat className="size-5" style={{ color: PRIMARY }} />
                            <h2 className="font-display text-lg font-semibold" style={{ color: DARK }}>
                                Order Aktif di Dapur
                            </h2>
                        </div>
                        {activeOrders.length === 0 ? (
                            <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                                Tidak ada order aktif.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {activeOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-[#F6F2E9]/50"
                                        style={{ borderColor: 'rgba(37,51,47,0.08)' }}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium" style={{ color: DARK }}>
                                                    Meja {order.table_code}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[11px]"
                                                    style={{ borderColor: SAND, color: PRIMARY }}
                                                >
                                                    {order.items_count} item
                                                </Badge>
                                            </div>
                                            <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: '#8a968f' }}>
                                                <Clock className="size-3" />
                                                {order.created_at}
                                            </p>
                                        </div>
                                        <Badge
                                            className="font-semibold"
                                            style={{
                                                backgroundColor: order.status === 'pending' ? 'rgba(207,192,164,0.2)' : PRIMARY,
                                                color: order.status === 'pending' ? SAND : '#FAF8F5',
                                                border: 'none',
                                            }}
                                        >
                                            {order.status === 'pending' ? 'Menunggu' : 'Diproses'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                        <div className="mb-4 flex items-center gap-2">
                            <TrendingUp className="size-5" style={{ color: PRIMARY }} />
                            <h2 className="font-display text-lg font-semibold" style={{ color: DARK }}>
                                Menu Terlaris Hari Ini
                            </h2>
                        </div>
                        {topMenus.length === 0 ? (
                            <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                                Belum ada data penjualan.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {topMenus.map((menu, i) => (
                                    <div
                                        key={menu.id}
                                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-[#F6F2E9]/50"
                                        style={{ borderColor: 'rgba(37,51,47,0.08)' }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-7 items-center justify-center rounded-full text-sm font-semibold" style={{ backgroundColor: 'rgba(79,107,106,0.12)', color: PRIMARY }}>
                                                {i + 1}
                                            </span>
                                            <span className="font-medium" style={{ color: DARK }}>
                                                {menu.name}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold" style={{ color: DARK }}>
                                                {menu.total_qty}
                                            </p>
                                            <p className="text-xs" style={{ color: '#8a968f' }}>
                                                Rp {Number(menu.total_revenue).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                    <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: 'rgba(37,51,47,0.08)' }}>
                        <Users className="size-5" style={{ color: PRIMARY }} />
                        <h2 className="font-display text-lg font-semibold" style={{ color: DARK }}>
                            Kehadiran Karyawan Hari Ini
                        </h2>
                    </div>
                    {todayAttendances.length === 0 ? (
                        <p className="px-6 py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                            Belum ada data kehadiran.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'rgba(37,51,47,0.08)', color: '#5c6a66' }}>
                                        <th className="px-6 py-3 font-semibold">Nama</th>
                                        <th className="px-6 py-3 font-semibold">Posisi</th>
                                        <th className="px-6 py-3 font-semibold">Jam Masuk</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todayAttendances.map((att) => (
                                        <tr key={att.id} className="border-b last:border-0 transition-colors hover:bg-[#F6F2E9]/30" style={{ borderColor: 'rgba(37,51,47,0.06)' }}>
                                            <td className="px-6 py-3 font-medium" style={{ color: DARK }}>
                                                {att.name}
                                            </td>
                                            <td className="px-6 py-3" style={{ color: '#5c6a66' }}>
                                                {att.position}
                                            </td>
                                            <td className="px-6 py-3" style={{ color: '#5c6a66' }}>
                                                {att.clock_in || '-'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Badge
                                                    className="font-semibold"
                                                    style={{
                                                        backgroundColor: att.clock_in ? 'rgba(79,107,106,0.12)' : 'rgba(207,192,164,0.2)',
                                                        color: att.clock_in ? PRIMARY : SAND,
                                                        border: 'none',
                                                    }}
                                                >
                                                    {att.clock_in ? 'Hadir' : 'Belum Absen'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
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

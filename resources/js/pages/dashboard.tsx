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
        <>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Ringkasan operasional restoran</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Penjualan Hari Ini</CardTitle>
                            <DollarSign className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                Rp {Number(todaySales).toLocaleString('id-ID')}
                            </div>
                            <p className="text-xs text-muted-foreground">Total pendapatan hari ini</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Order Hari Ini</CardTitle>
                            <ShoppingCart className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{todayOrdersCount}</div>
                            <p className="text-xs text-muted-foreground">Jumlah order hari ini</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Menu Terlaris</CardTitle>
                            <TrendingUp className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {topMenus.length > 0 ? (
                                <div className="text-2xl font-bold">{topMenus[0].name}</div>
                            ) : (
                                <div className="text-2xl font-bold text-muted-foreground">-</div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {topMenus.length > 0
                                    ? `${topMenus[0].total_qty} terjual hari ini`
                                    : 'Belum ada data'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Karyawan Hadir</CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {todayAttendances.filter((a) => a.clock_in).length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Dari {todayAttendances.length} karyawan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <ChefHat className="size-5 text-muted-foreground" />
                            <CardTitle>Order Aktif di Dapur</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeOrders.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    Tidak ada order aktif.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {activeOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        Meja {order.table_code}
                                                    </span>
                                                    <Badge variant="outline">
                                                        {order.items_count} item
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="size-3" />
                                                    {order.created_at}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    order.status === 'pending'
                                                        ? 'secondary'
                                                        : 'default'
                                                }
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

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <TrendingUp className="size-5 text-muted-foreground" />
                            <CardTitle>Menu Terlaris Hari Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topMenus.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    Belum ada data penjualan.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topMenus.map((menu, i) => (
                                        <div
                                            key={menu.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                                    {i + 1}
                                                </span>
                                                <span className="font-medium">{menu.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold">
                                                    {menu.total_qty}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
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

                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <Users className="size-5 text-muted-foreground" />
                        <CardTitle>Kehadiran Karyawan Hari Ini</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {todayAttendances.length === 0 ? (
                            <p className="px-6 py-4 text-center text-sm text-muted-foreground">
                                Belum ada data kehadiran.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="px-6 py-3 font-medium">Nama</th>
                                        <th className="px-6 py-3 font-medium">Posisi</th>
                                        <th className="px-6 py-3 font-medium">Jam Masuk</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {todayAttendances.map((att) => (
                                        <tr key={att.id} className="border-b last:border-0">
                                            <td className="px-6 py-3 font-medium">{att.name}</td>
                                            <td className="px-6 py-3 text-muted-foreground">
                                                {att.position}
                                            </td>
                                            <td className="px-6 py-3">
                                                {att.clock_in || '-'}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Badge
                                                    variant={
                                                        att.clock_in ? 'default' : 'secondary'
                                                    }
                                                >
                                                    {att.clock_in ? 'Hadir' : 'Belum Absen'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
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

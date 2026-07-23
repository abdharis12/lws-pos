import { Head, router } from '@inertiajs/react';
import { TrendingUp, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';

interface MenuItem {
    id: number;
    name: string;
    total_qty: number;
    total_revenue: number;
}

interface OptionItem {
    id: number;
    name: string;
    group_name: string;
    total_used: number;
    total_adjustment: number;
}

interface Props {
    menus: MenuItem[];
    topOptionItems: OptionItem[];
    startDate: string;
    endDate: string;
}

export default function TopMenus({ menus, topOptionItems, startDate, endDate }: Props) {
    const maxQty = Math.max(1, ...menus.map((m) => m.total_qty));

    return (
        <>
            <Head title="Menu & Varian Terlaris" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.get('/admin/reports')}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                            Menu & Varian Terlaris
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                            {startDate} s.d. {endDate}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                            <TrendingUp className="size-5" style={{ color: PRIMARY }} />
                            Menu Terlaris
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {menus.length === 0 ? (
                            <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                                Belum ada data penjualan.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {menus.map((menu, i) => (
                                    <div key={menu.id}>
                                        <div className="mb-1 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="flex size-6 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(79,107,106,0.12)', color: PRIMARY }}>
                                                    {i + 1}
                                                </span>
                                                <span className="text-sm font-medium" style={{ color: DARK }}>
                                                    {menu.name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold" style={{ color: DARK }}>
                                                {menu.total_qty} terjual
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-[#F6F2E9]" style={{ backgroundColor: 'rgba(79,107,106,0.08)' }}>
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${(menu.total_qty / maxQty) * 100}%`, backgroundColor: PRIMARY }}
                                            />
                                        </div>
                                        <p className="mt-0.5 text-xs" style={{ color: '#8a968f' }}>
                                            Rp {menu.total_revenue.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                            <Sparkles className="size-5" style={{ color: PRIMARY }} />
                            Topping & Add-on Terpopuler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topOptionItems.length === 0 ? (
                            <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                                Belum ada data varian terjual.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'rgba(37,51,47,0.08)', color: '#5c6a66' }}>
                                            <th className="px-4 py-3 font-semibold">Varian</th>
                                            <th className="px-4 py-3 font-semibold">Grup</th>
                                            <th className="px-4 py-3 font-semibold text-right">Digunakan</th>
                                            <th className="px-4 py-3 font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topOptionItems.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0 transition-colors hover:bg-[#F6F2E9]/30" style={{ borderColor: 'rgba(37,51,47,0.06)' }}>
                                                <td className="px-4 py-3 font-medium" style={{ color: DARK }}>
                                                    {item.name}
                                                </td>
                                                <td className="px-4 py-3" style={{ color: '#5c6a66' }}>
                                                    {item.group_name}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold" style={{ color: DARK }}>
                                                    {item.total_used}x
                                                </td>
                                                <td className="px-4 py-3 text-right" style={{ color: '#5c6a66' }}>
                                                    Rp {item.total_adjustment.toLocaleString('id-ID')}
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
        </>
    );
}

TopMenus.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Menu & Varian Terlaris', href: '/admin/reports/top-menus' },
    ],
};

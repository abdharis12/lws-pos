import { Head, router } from '@inertiajs/react';
import { TrendingUp, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Menu & Varian Terlaris" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.get('/admin/reports')}
                        className="text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                            <TrendingUp className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                            <span>Menu & Varian</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                            Menu & Varian Terlaris
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            Periode: {startDate} s.d. {endDate}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="mb-6 border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                        <TrendingUp className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                        Menu Terlaris
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {menus.length === 0 ? (
                        <p className="py-4 text-center text-sm italic text-slate-500">
                            Belum ada data penjualan.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {menus.map((menu, i) => (
                                <div key={menu.id}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className="flex size-7 items-center justify-center rounded-full bg-[oklch(0.48_0.032_195.5)]/10 text-xs font-bold text-[oklch(0.48_0.032_195.5)]">
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-slate-800">{menu.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-[oklch(0.48_0.032_195.5)]">
                                            {menu.total_qty} terjual
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[oklch(0.48_0.032_195.5)]/8">
                                        <div
                                            className="h-full rounded-full bg-[oklch(0.48_0.032_195.5)] transition-all"
                                            style={{ width: `${(menu.total_qty / maxQty) * 100}%` }}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Rp {Math.ceil(menu.total_revenue).toLocaleString('id-ID')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                        <Sparkles className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                        Topping & Add-on Terpopuler
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {topOptionItems.length === 0 ? (
                        <p className="py-8 text-center text-sm italic text-slate-500">
                            Belum ada data varian terjual.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                        <th className="px-6 py-3.5 font-semibold">Varian</th>
                                        <th className="px-6 py-3.5 font-semibold">Grup</th>
                                        <th className="px-6 py-3.5 font-semibold text-right">Digunakan</th>
                                        <th className="px-6 py-3.5 font-semibold text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                    {topOptionItems.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{item.group_name}</td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">{item.total_used}x</td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                Rp {Math.ceil(item.total_adjustment).toLocaleString('id-ID')}
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

TopMenus.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Menu & Varian Terlaris', href: '/admin/reports/top-menus' },
    ],
};

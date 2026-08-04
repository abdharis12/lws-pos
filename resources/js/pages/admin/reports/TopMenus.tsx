import { Head } from '@inertiajs/react';
import { TrendingUp, Sparkles, ChefHat } from 'lucide-react';
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

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';

export default function TopMenus({
    menus,
    topOptionItems,
    startDate,
    endDate,
}: Props) {
    const maxQty = Math.max(1, ...menus.map((m) => m.total_qty));

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Menu & Varian Terlaris" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                                <TrendingUp className="size-3.5 text-[#4F6B6A]" />
                                <span>Menu & Varian</span>
                            </div>
                            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                                Menu & Varian Terlaris
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 italic">
                                Periode: {startDate} s.d. {endDate}
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="mb-6 border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                            <TrendingUp className="size-5 text-[#CFC0A4]" />
                            Menu Terlaris
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {menus.length === 0 ? (
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
                                <h2
                                    className="font-serif text-xl font-bold"
                                    style={{ color: INK }}
                                >
                                    Belum Ada Data
                                </h2>
                                <p
                                    className="mt-1 max-w-sm text-sm"
                                    style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                >
                                    Data menu terlaris belum tersedia.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {menus.map((menu, i) => (
                                    <div key={menu.id}>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="flex size-7 items-center justify-center rounded-full bg-[#4F6B6A]/10 text-xs font-bold text-[#4F6B6A]">
                                                    {i + 1}
                                                </span>
                                                <span className="font-medium text-slate-800">
                                                    {menu.name}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-[#4F6B6A]">
                                                {menu.total_qty} terjual
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#4F6B6A]/8">
                                            <div
                                                className="h-full rounded-full bg-[#4F6B6A] transition-all"
                                                style={{
                                                    width: `${(menu.total_qty / maxQty) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Rp{' '}
                                            {Math.ceil(
                                                menu.total_revenue,
                                            ).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                            <Sparkles className="size-5 text-[#CFC0A4]" />
                            Topping & Add-on Terpopuler
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topOptionItems.length === 0 ? (
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
                                <h2
                                    className="font-serif text-xl font-bold"
                                    style={{ color: INK }}
                                >
                                    Belum Ada Data
                                </h2>
                                <p
                                    className="mt-1 max-w-sm text-sm"
                                    style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                >
                                    Data topping & add-on belum tersedia.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                            <th className="px-6 py-3.5 font-semibold">
                                                Varian
                                            </th>
                                            <th className="px-6 py-3.5 font-semibold">
                                                Grup
                                            </th>
                                            <th className="px-6 py-3.5 text-right font-semibold">
                                                Digunakan
                                            </th>
                                            <th className="px-6 py-3.5 text-right font-semibold">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#CFC0A4]/15">
                                        {topOptionItems.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-[#CFC0A4]/5"
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-800">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {item.group_name}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-slate-800">
                                                    {item.total_used}x
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-600">
                                                    Rp{' '}
                                                    {Math.ceil(
                                                        item.total_adjustment,
                                                    ).toLocaleString('id-ID')}
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

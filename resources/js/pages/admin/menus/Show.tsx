import { Head, Link } from '@inertiajs/react';
import { Pencil, ArrowLeft, Utensils, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OptionItem {
    id: number;
    name: string;
    price_adjustment: string | number;
    is_available: boolean;
}

interface OptionGroup {
    id: number;
    name: string;
    selection_type: string;
    is_required: boolean;
    option_items: OptionItem[];
}

interface MenuData {
    id: number;
    name: string;
    description: string | null;
    price: string | number;
    photo_path: string | null;
    is_available: boolean;
    category: { id: number; name: string };
    option_groups: OptionGroup[];
}

interface Props {
    menu: MenuData;
}

export default function MenusShow({ menu }: Props) {
    return (
        <>
            <Head title={menu.name} />

            <div className="min-h-screen p-6 font-sans text-slate-800">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/menus">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#4F6B6A] hover:bg-[#CFC0A4]/10"
                            >
                                <ArrowLeft className="size-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                                <Utensils className="size-3.5 text-[#4F6B6A]" />
                                <span>Detail Menu</span>
                            </div>
                            <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                                {menu.name}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500 italic">
                                Detail hidangan menu
                            </p>
                        </div>
                    </div>
                    <Link href={`/admin/menus/${menu.id}/edit`}>
                        <Button className="bg-[#4F6B6A] text-white hover:bg-[#3B5655]">
                            <Pencil className="mr-2 size-4" />
                            Edit Menu
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                            <div className="flex aspect-video items-center justify-center bg-[#4F6B6A]/5 text-[#4F6B6A]">
                                {menu.photo_path ? (
                                    <img
                                        src={`/storage/${menu.photo_path}`}
                                        alt={menu.name}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <span className="text-6xl opacity-30">
                                        {menu.name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-serif text-2xl font-bold text-[#4F6B6A]">
                                        Rp{' '}
                                        {Number(menu.price).toLocaleString(
                                            'id-ID',
                                        )}
                                    </span>
                                    <Badge
                                        className={
                                            menu.is_available
                                                ? 'border border-[#CFC0A4]/30 bg-[#4F6B6A] text-xs font-normal tracking-wide text-white'
                                                : 'border border-slate-200 bg-slate-100 text-xs font-normal text-slate-500'
                                        }
                                    >
                                        {menu.is_available
                                            ? 'Tersedia'
                                            : 'Habis'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                        <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                            <CardHeader className="border-b border-[#CFC0A4]/20">
                                <CardTitle className="font-serif text-lg font-medium text-[#4F6B6A]">
                                    Informasi Menu
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-5">
                                <div>
                                    <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                        Kategori
                                    </span>
                                    <p className="mt-1 font-medium text-slate-800">
                                        {menu.category.name}
                                    </p>
                                </div>
                                <div>
                                    <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                        Bahan Utama
                                    </span>
                                    <p className="mt-1 font-medium text-slate-800">
                                        {menu.description || '-'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                            <CardHeader className="border-b border-[#CFC0A4]/20">
                                <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                                    <Layers className="size-4 text-[#CFC0A4]" />
                                    Grup Opsi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5">
                                {menu.option_groups.length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        Tidak ada grup opsi.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {menu.option_groups.map((group) => (
                                            <div key={group.id}>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <h4 className="font-medium text-slate-800">
                                                        {group.name}
                                                    </h4>
                                                    <Badge
                                                        variant="outline"
                                                        className="border-[#CFC0A4]/40 text-[#4F6B6A]"
                                                    >
                                                        {group.selection_type ===
                                                        'single'
                                                            ? 'Pilih 1'
                                                            : 'Pilih banyak'}
                                                    </Badge>
                                                    {group.is_required && (
                                                        <Badge className="bg-[#4F6B6A]/10 text-[#4F6B6A]">
                                                            Wajib
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="ml-2 space-y-1 border-l-2 border-[#CFC0A4]/40 pl-4">
                                                    {group.option_items.map(
                                                        (item) => (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center justify-between text-sm"
                                                            >
                                                                <span className="text-slate-700">
                                                                    {item.name}
                                                                </span>
                                                                <span className="text-slate-500">
                                                                    {Number(
                                                                        item.price_adjustment,
                                                                    ) > 0
                                                                        ? `+Rp ${Number(item.price_adjustment).toLocaleString('id-ID')}`
                                                                        : 'Gratis'}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

MenusShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Menu', href: '/admin/menus' },
        { title: 'Detail', href: '#' },
    ],
};

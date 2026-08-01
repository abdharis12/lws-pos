import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    Pencil,
    Trash2,
    EyeOff,
    Eye,
    Search,
    Utensils,
    Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface MenuCategory {
    id: number;
    name: string;
}

interface MenuItem {
    id: number;
    name: string;
    description: string | null;
    price: string | number;
    photo_path: string | null;
    is_available: boolean;
    category: MenuCategory;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    data: MenuItem[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    menus: PaginationMeta;
    categories: MenuCategory[];
    filters: { search?: string; category_id?: string };
}

export default function MenusIndex({ menus, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryFilter, setCategoryFilter] = useState(
        filters.category_id ?? 'all',
    );
    const [deleteConfirm, setDeleteConfirm] = useState<MenuItem | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                search !== (filters.search ?? '') ||
                categoryFilter !== (filters.category_id ?? 'all')
            ) {
                router.get(
                    '/admin/menus',
                    {
                        search: search || undefined,
                        category_id:
                            categoryFilter !== 'all'
                                ? categoryFilter
                                : undefined,
                    },
                    { preserveScroll: true, preserveState: true },
                );
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search, categoryFilter]);

    function toggleAvailability(menuId: number) {
        router.patch(`/admin/menus/${menuId}/toggle-availability`);
    }

    function destroy(menuId: number) {
        const menu = menus.data.find((m) => m.id === menuId) ?? null;
        setDeleteConfirm(menu);
    }

    function confirmDelete() {
        if (!deleteConfirm) {
return;
}

        router.delete(`/admin/menus/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    return (
        <div className="min-h-screen bg-[#F6F2E9] p-6 font-sans text-slate-800">
            <Head title="Menu - European Classic" />

            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Utensils className="size-3.5 text-[#4F6B6A]" />
                            <span>Koleksi Menu Kuliner</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Daftar Menu
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola katalog sajian makanan dan minuman restoran
                            Anda.
                        </p>
                    </div>

                    <Link href="/admin/menus/create">
                        <Button>
                            <Plus className="size-4 text-[#CFC0A4]" />
                            <span className="font-medium tracking-wide">
                                Menu
                            </span>
                        </Button>
                    </Link>
                </div>

                {/* Filter & Search Controls */}
                <div className="mb-8 flex flex-wrap items-center gap-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#CFC0A4]" />
                        <Input
                            placeholder="Cari nama menu..."
                            className="border-[#CFC0A4]/50 bg-white pl-9 focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Select
                        value={categoryFilter}
                        onValueChange={setCategoryFilter}
                    >
                        <SelectTrigger className="w-48 border-[#CFC0A4]/50 bg-white focus:ring-[#4F6B6A]">
                            <SelectValue placeholder="Semua kategori" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {categories &&
                                Array.isArray(categories) &&
                                categories.map((cat) => (
                                    <SelectItem
                                        key={cat.id}
                                        value={String(cat.id)}
                                    >
                                        {cat.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Grid Menu Cards */}
                <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {menus.data.map((menu) => (
                        <Card
                            key={menu.id}
                            className="group overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[#CFC0A4] hover:shadow-md"
                        >
                            {/* Image Container with Elegant Classic Framing */}
                            <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5">
                                {menu.photo_path ? (
                                    <img
                                        src={`/storage/${menu.photo_path}`}
                                        alt={menu.name}
                                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-[#4F6B6A]/10 to-[#CFC0A4]/20 text-[#4F6B6A]">
                                        <span className="font-serif text-5xl font-bold opacity-30">
                                            {menu.name.charAt(0)}
                                        </span>
                                    </div>
                                )}

                                {/* Floating Badge */}
                                <div className="absolute top-3 right-3">
                                    {menu.is_available ? (
                                        <Badge className="border border-[#CFC0A4]/30 bg-[#4F6B6A] text-xs font-normal tracking-wide text-white">
                                            Tersedia
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="secondary"
                                            className="border border-slate-200 bg-slate-100 text-xs font-normal text-slate-500"
                                        >
                                            Habis
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Card Info Header */}
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <Badge className="rounded-full border border-primary bg-secondary/30 text-xs font-normal text-primary">
                                            {menu.category.name}
                                        </Badge>
                                        <h3 className="mt-3 font-serif text-xl font-medium tracking-tight text-[#4F6B6A] group-hover:text-[#3B5655]">
                                            {menu.name}
                                        </h3>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* Card Content & Actions */}
                            <CardContent>
                                <p className="mb-4 line-clamp-2 text-xs text-slate-500 italic">
                                    {menu.description ||
                                        'Tidak ada deskripsi singkat untuk menu ini.'}
                                </p>

                                <div className="flex items-center justify-between border-t border-[#CFC0A4]/20 pt-3">
                                    <div>
                                        <span className="block text-[10px] tracking-wider text-slate-400 uppercase">
                                            Harga
                                        </span>
                                        <span className="font-serif text-lg font-semibold text-slate-800">
                                            Rp{' '}
                                            {Number(menu.price).toLocaleString(
                                                'id-ID',
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() =>
                                                toggleAvailability(menu.id)
                                            }
                                            className="size-8"
                                            title={
                                                menu.is_available
                                                    ? 'Tandai Habis'
                                                    : 'Tandai Tersedia'
                                            }
                                        >
                                            {menu.is_available ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </Button>

                                        <Link
                                            href={`/admin/menus/${menu.id}/edit`}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 bg-primary text-secondary transition-colors hover:bg-primary/70 hover:text-secondary"
                                                title="Edit Menu"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                        </Link>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => destroy(menu.id)}
                                            className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                            title="Hapus Menu"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {menus.data.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                                <div className="mb-3 rounded-full bg-[#CFC0A4]/20 p-4 text-[#4F6B6A]">
                                    <Sparkles className="size-6" />
                                </div>
                                <h4 className="font-serif text-lg font-medium text-slate-700">
                                    Menu Tidak Ditemukan
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 italic">
                                    Cobalah untuk merubah kata kunci pencarian
                                    atau mengganti filter kategori.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-8">
                    <hr className="border border-[#CFC0A4]/40" />
                    <Pagination meta={menus} />
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={!!deleteConfirm}
                    onOpenChange={(open) => !open && setDeleteConfirm(null)}
                >
                    <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                        <DialogHeader>
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                                <Trash2 className="size-6 text-rose-600" />
                            </div>
                            <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[#4F6B6A]">
                                Hapus Menu
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin menghapus menu{' '}
                                <span className="font-semibold text-[#4F6B6A]">
                                    {deleteConfirm?.name}
                                </span>
                                ? Tindakan ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-center">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteConfirm(null)}
                                className="border border-[#CFC0A4]/40 text-slate-600 hover:bg-[#CFC0A4]/10"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className="bg-rose-700 text-white hover:bg-rose-800"
                            >
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

MenusIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Menu', href: '/admin/menus' },
    ],
};

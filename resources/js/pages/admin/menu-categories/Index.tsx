import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Layers, Hash, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';

interface Category {
    id: number;
    name: string;
    sort_order: number;
}

interface PaginationLink { url: string | null; label: string; active: boolean; }

interface PaginationMeta {
    data: Category[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    categories: PaginationMeta;
    filters: { search?: string };
}

export default function MenuCategoriesIndex({ categories, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        sort_order: '0',
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get(
                    '/admin/menu-categories',
                    { search: search || undefined },
                    { preserveScroll: true, preserveState: true },
                );
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    function openCreate() {
        setEditing(null);
        reset();
        setOpen(true);
    }

    function openEdit(cat: Category) {
        setEditing(cat);
        setData({ name: cat.name, sort_order: String(cat.sort_order) });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/menu-categories/${editing.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        } else {
            post('/admin/menu-categories', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
            destroy(`/admin/menu-categories/${id}`);
        }
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Kategori Menu" />

            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <Layers className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Kategori Management</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Kategori Menu
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Atur struktur dan hierarki penyajian hidangan restoran Anda.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="size-4 text-[oklch(0.80_0.038_88.5)]" />
                            <span className="font-medium tracking-wide">Tambah Kategori</span>
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="border-[oklch(0.80_0.038_88.5)]/50 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md shadow-xl">
                        <DialogHeader className="border-b border-[oklch(0.80_0.038_88.5)]/30 pb-4">
                            <DialogTitle className="font-serif text-xl font-semibold text-[oklch(0.48_0.032_195.5)]">
                                {editing ? 'Edit Kategori Menu' : 'Tambah Kategori Baru'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submit} className="mt-4 space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">
                                    Nama Kategori
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: Appetizer, Main Course, Wine..."
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="border-[oklch(0.80_0.038_88.5)]/60 bg-white/80 focus-visible:ring-[oklch(0.48_0.032_195.5)] focus-visible:border-[oklch(0.48_0.032_195.5)]"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sort_order" className="text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)] font-semibold">
                                    Urutan Tampilan
                                </Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min="0"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', e.target.value)}
                                    className="border-[oklch(0.80_0.038_88.5)]/60 bg-white/80 focus-visible:ring-[oklch(0.48_0.032_195.5)] focus-visible:border-[oklch(0.48_0.032_195.5)]"
                                />
                                <InputError message={errors.sort_order} />
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.38_0.032_195.5)] transition-colors font-serif tracking-wider uppercase text-xs py-5"
                                >
                                    {editing ? 'Simpan Perubahan' : 'Buat Kategori'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="mb-8 flex flex-wrap items-center gap-4">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[oklch(0.80_0.038_88.5)]" />
                    <Input
                        placeholder="Cari nama kategori..."
                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 pl-9 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-white/40 px-6 py-4">
                    <CardTitle className="font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)] flex items-center gap-2">
                        <Layers className="size-4 text-[oklch(0.80_0.038_88.5)]" />
                        Daftar Kategori
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                    <th className="px-6 py-3.5 font-semibold">Nama Kategori</th>
                                    <th className="px-6 py-3.5 font-semibold">Urutan</th>
                                    <th className="px-6 py-3.5 font-semibold">Status</th>
                                    <th className="px-6 py-3.5 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                {categories.data.map((cat) => (
                                    <tr
                                        key={cat.id}
                                        className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5 group"
                                    >
                                        <td className="px-6 py-4 font-serif text-base font-medium text-slate-800">
                                            {cat.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.80_0.038_88.5)]/20 px-2.5 py-0.5 text-xs font-semibold text-[oklch(0.48_0.032_195.5)]">
                                                <Hash className="size-3" />
                                                {cat.sort_order}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center gap-1 rounded-full border border-[oklch(0.80_0.038_88.5)]/50 bg-[oklch(0.98_0.005_85.0)] px-3 py-1 text-xs font-semibold tracking-wide text-[oklch(0.48_0.032_195.5)] shadow-sm">
                                                <span className="h-2 w-2 rounded-full bg-[oklch(0.48_0.032_195.5)]" />
                                                Aktif
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(cat)}
                                                    className="size-8 bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.48_0.032_195.5)]/70 hover:text-white transition-colors"
                                                    title="Edit Kategori"
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                                    title="Hapus Kategori"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {categories.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center">
                                            <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                <div className="rounded-full bg-[oklch(0.80_0.038_88.5)]/20 p-3 text-[oklch(0.48_0.032_195.5)] mb-3">
                                                    <Sparkles className="size-6" />
                                                </div>
                                                <p className="font-serif text-base font-medium text-slate-700">Belum Ada Kategori</p>
                                                <p className="mt-1 text-xs text-slate-500 italic">
                                                    Tambahkan kategori menu seperti Entrée, Dessert, atau Beverage untuk memulai.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="mt-8">
                <hr className="border border-[oklch(0.80_0.038_88.5)]/40" />
                <Pagination meta={categories} />
            </div>
        </div>
    );
}

MenuCategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Kategori Menu', href: '/admin/menu-categories' },
    ],
};

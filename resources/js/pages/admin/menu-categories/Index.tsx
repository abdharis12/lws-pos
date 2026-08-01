import { Head, useForm, router } from '@inertiajs/react';
import { Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

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
    const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
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
        const category = categories.data.find((c) => c.id === id) ?? null;
        setDeleteConfirm(category);
    }

    function confirmDelete() {
        if (!deleteConfirm) {
return;
}

        destroy(`/admin/menu-categories/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    return (
        <div className="min-h-screen bg-[#F6F2E9] p-6 font-sans text-slate-800">
            <Head title="Kategori Menu" />

            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <Layers className="size-3.5 text-[#4F6B6A]" />
                            <span>Kategori Management</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Kategori Menu
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Atur struktur dan hierarki penyajian hidangan
                            restoran Anda.
                        </p>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate}>
                                <Plus className="size-4 text-[#CFC0A4]" />
                                <span className="font-medium tracking-wide">
                                    Tambah Kategori
                                </span>
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="border-[#CFC0A4]/50 bg-[#F6F2E9] shadow-xl sm:max-w-md">
                            <DialogHeader className="border-b border-[#CFC0A4]/30 pb-4">
                                <DialogTitle className="font-serif text-xl font-semibold text-[#4F6B6A]">
                                    {editing
                                        ? 'Edit Kategori Menu'
                                        : 'Tambah Kategori Baru'}
                                </DialogTitle>
                            </DialogHeader>

                            <form onSubmit={submit} className="mt-4 space-y-5">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="name"
                                        className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                    >
                                        Nama Kategori
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="Contoh: Appetizer, Main Course, Wine..."
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        className="border-[#CFC0A4]/60 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label
                                        htmlFor="sort_order"
                                        className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase"
                                    >
                                        Urutan Tampilan
                                    </Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        min="0"
                                        value={data.sort_order}
                                        onChange={(e) =>
                                            setData(
                                                'sort_order',
                                                e.target.value,
                                            )
                                        }
                                        className="border-[#CFC0A4]/60 bg-white focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                                    />
                                    <InputError message={errors.sort_order} />
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-[#4F6B6A] py-5 font-serif text-xs tracking-wider text-white uppercase transition-colors hover:bg-[#3B5655]"
                                    >
                                        {editing
                                            ? 'Simpan Perubahan'
                                            : 'Buat Kategori'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <div className="mb-8 flex flex-wrap items-center gap-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#CFC0A4]" />
                        <Input
                            placeholder="Cari nama kategori..."
                            className="border-[#CFC0A4]/50 bg-white pl-9 focus-visible:border-[#4F6B6A] focus-visible:ring-[#4F6B6A]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20 bg-white/40 px-6 py-4">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                            <Layers className="size-4 text-[#CFC0A4]" />
                            Daftar Kategori
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-xs tracking-wider text-[#4F6B6A] uppercase">
                                        <th className="px-6 py-3.5 font-semibold">
                                            Nama Kategori
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Urutan
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Status
                                        </th>
                                        <th className="px-6 py-3.5 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#CFC0A4]/15">
                                    {categories.data.map((cat) => (
                                        <tr
                                            key={cat.id}
                                            className="group transition-colors hover:bg-[#CFC0A4]/5"
                                        >
                                            <td className="px-6 py-4 font-serif text-base font-medium text-slate-800">
                                                {cat.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#CFC0A4]/20 px-2.5 py-0.5 text-xs font-semibold text-[#4F6B6A]">
                                                    <Hash className="size-3" />
                                                    {cat.sort_order}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center gap-1 rounded-full border border-[#CFC0A4]/50 bg-[#F6F2E9] px-3 py-1 text-xs font-semibold tracking-wide text-[#4F6B6A] shadow-sm">
                                                    <span className="h-2 w-2 rounded-full bg-[#4F6B6A]" />
                                                    Aktif
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEdit(cat)
                                                        }
                                                        className="size-8 bg-[#4F6B6A] text-white transition-colors hover:bg-[#4F6B6A]/70 hover:text-white"
                                                        title="Edit Kategori"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleDelete(cat.id)
                                                        }
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
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center"
                                            >
                                                <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-center">
                                                    <div className="mb-3 rounded-full bg-[#CFC0A4]/20 p-3 text-[#4F6B6A]">
                                                        <Sparkles className="size-6" />
                                                    </div>
                                                    <p className="font-serif text-base font-medium text-slate-700">
                                                        Belum Ada Kategori
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500 italic">
                                                        Tambahkan kategori menu
                                                        seperti Entrée, Dessert,
                                                        atau Beverage untuk
                                                        memulai.
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
                    <hr className="border border-[#CFC0A4]/40" />
                    <Pagination meta={categories} />
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
                                Hapus Kategori
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-500">
                                Apakah Anda yakin ingin menghapus kategori{' '}
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

MenuCategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Kategori Menu', href: '/admin/menu-categories' },
    ],
};

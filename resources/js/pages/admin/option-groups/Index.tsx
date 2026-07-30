import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, X, Search, Layers, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface OptionItem {
    id: number;
    name: string;
    price_adjustment: string | number;
    is_available: boolean;
    sort_order: number;
}

interface OptionGroup {
    id: number;
    name: string;
    selection_type: string;
    is_required: boolean;
    min_select: number;
    max_select: number;
    option_items: OptionItem[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    data: OptionGroup[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    groups: PaginationMeta;
    filters: { search?: string };
}

export default function OptionGroupsIndex({ groups, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<OptionGroup | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteConfirm, setDeleteConfirm] = useState<OptionGroup | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        selection_type: 'single',
        is_required: false,
        min_select: '0',
        max_select: '0',
        items: [] as { name: string; price_adjustment: string; is_available?: boolean; sort_order?: number }[],
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search ?? '')) {
                router.get(
                    '/admin/option-groups',
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

    function openEdit(group: OptionGroup) {
        setEditing(group);
        setData({
            name: group.name,
            selection_type: group.selection_type,
            is_required: group.is_required,
            min_select: String(group.min_select),
            max_select: String(group.max_select),
            items: group.option_items.map((i) => ({
                name: i.name,
                price_adjustment: String(i.price_adjustment),
                is_available: i.is_available,
                sort_order: i.sort_order,
            })),
        });
        setOpen(true);
    }

    function addItem() {
        setData('items', [...data.items, { name: '', price_adjustment: '0', is_available: true, sort_order: 0 }]);
    }

    function removeItem(index: number) {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    }

    function updateItem(index: number, field: 'name' | 'price_adjustment', value: string) {
        const items = [...data.items];
        items[index][field] = value;
        setData('items', items);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (editing) {
            put(`/admin/option-groups/${editing.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        } else {
            post('/admin/option-groups', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
                preserveScroll: true,
            });
        }
    }

    function handleDelete(id: number) {
        const group = groups.data.find((g) => g.id === id) ?? null;
        setDeleteConfirm(group);
    }

    function confirmDelete() {
        if (!deleteConfirm) return;
        destroy(`/admin/option-groups/${deleteConfirm.id}`);
        setDeleteConfirm(null);
    }

    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Grup Opsi" />

            {/* Header Section */}
            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                        <Layers className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                        <span>Pengaturan Opsi Kuliner</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                        Grup Opsi
                    </h1>
                    <p className="mt-1 text-sm italic text-slate-500">
                        Kelola opsi tambahan untuk varian menu restoran Anda.
                    </p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>
                            <Plus className="size-4 text-[oklch(0.80_0.038_88.5)]" />
                            <span className="font-medium tracking-wide">Tambah Grup</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-xl text-[oklch(0.48_0.032_195.5)]">
                                {editing ? 'Edit Grup Opsi' : 'Tambah Grup Opsi'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Grup</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="selection_type">Tipe Seleksi</Label>
                                <Select
                                    value={data.selection_type}
                                    onValueChange={(v) => setData('selection_type', v)}
                                >
                                    <SelectTrigger className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus:ring-[oklch(0.48_0.032_195.5)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)]">
                                        <SelectItem value="single">Pilih Satu</SelectItem>
                                        <SelectItem value="multiple">Pilih Banyak</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.selection_type} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_required"
                                    checked={data.is_required}
                                    onCheckedChange={(v) => setData('is_required', v === true)}
                                />
                                <Label htmlFor="is_required">Wajib dipilih</Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="min_select">Min. Pilih</Label>
                                    <Input
                                        id="min_select"
                                        type="number"
                                        min="0"
                                        value={data.min_select}
                                        onChange={(e) => setData('min_select', e.target.value)}
                                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="max_select">Maks. Pilih</Label>
                                    <Input
                                        id="max_select"
                                        type="number"
                                        min="0"
                                        value={data.max_select}
                                        onChange={(e) => setData('max_select', e.target.value)}
                                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Item Opsi</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                        <Plus className="mr-1 size-3" />
                                        Tambah Item
                                    </Button>
                                </div>
                                {data.items.map((item, i) => (
                                    <div key={i} className="flex items-end gap-2 rounded-md border border-[oklch(0.80_0.038_88.5)]/30 bg-white/60 p-2">
                                        <div className="flex-1">
                                            <Label className="text-xs">Nama</Label>
                                            <Input
                                                value={item.name}
                                                onChange={(e) => updateItem(i, 'name', e.target.value)}
                                                placeholder="Nama item"
                                                className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                            />
                                        </div>
                                        <div className="w-28">
                                            <Label className="text-xs">Tambahan (Rp)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.price_adjustment}
                                                onChange={(e) => updateItem(i, 'price_adjustment', e.target.value)}
                                                className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(i)}
                                            className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                                <InputError message={errors['items.0.name']} />
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.42_0.032_195.5)]"
                            >
                                {editing ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filter & Search Controls */}
            <div className="mb-8 flex flex-wrap items-center gap-4">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[oklch(0.80_0.038_88.5)]" />
                    <Input
                        placeholder="Cari nama grup opsi..."
                        className="border-[oklch(0.80_0.038_88.5)]/50 bg-white/80 pl-9 focus-visible:border-[oklch(0.48_0.032_195.5)] focus-visible:ring-[oklch(0.48_0.032_195.5)]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid Option Group Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups.data.map((group) => (
                    <Card
                        key={group.id}
                        className="group overflow-hidden border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[oklch(0.80_0.038_88.5)] hover:shadow-md"
                    >
                        {/* Card Header */}
                        <CardHeader className="pb-2 pt-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[oklch(0.80_0.038_88.5)]">
                                        {group.selection_type === 'single' ? 'Pilih Satu' : 'Pilih Banyak'}
                                    </span>
                                    <h3 className="font-serif mt-1 text-xl font-medium tracking-tight text-[oklch(0.48_0.032_195.5)] group-hover:text-[oklch(0.38_0.032_195.5)]">
                                        {group.name}
                                    </h3>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {group.is_required && (
                                            <Badge className="border border-[oklch(0.80_0.038_88.5)]/30 bg-[oklch(0.48_0.032_195.5)] text-xs font-normal tracking-wide text-white">
                                                Wajib
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEdit(group)}
                                        className="size-8 bg-primary text-secondary hover:bg-primary/70 hover:text-secondary transition-colors"
                                        title="Edit Grup"
                                    >
                                        <Pencil className="size-4" />
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(group.id)}
                                        className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                        title="Hapus Grup"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        {/* Card Content - Items List */}
                        <CardContent className="pt-2">
                            {group.option_items.length === 0 ? (
                                <p className="text-xs italic text-slate-500">Tidak ada item opsi.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {group.option_items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-center justify-between border-t border-[oklch(0.80_0.038_88.5)]/10 py-1.5 text-sm"
                                        >
                                            <span className="text-slate-700">{item.name}</span>
                                            <span className="font-serif text-xs font-medium text-slate-600">
                                                {Number(item.price_adjustment) > 0
                                                    ? `+Rp ${Number(item.price_adjustment).toLocaleString('id-ID')}`
                                                    : 'Gratis'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State */}
                {groups.data.length === 0 && (
                    <div className="col-span-full py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                            <div className="mb-3 rounded-full bg-[oklch(0.80_0.038_88.5)]/20 p-4 text-[oklch(0.48_0.032_195.5)]">
                                <Sparkles className="size-6" />
                            </div>
                            <h4 className="font-serif text-lg font-medium text-slate-700">Grup Opsi Tidak Ditemukan</h4>
                            <p className="mt-1 text-xs italic text-slate-500">
                                Cobalah untuk merubah kata kunci pencarian atau tambahkan grup opsi baru.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="mt-8">
                <hr className="border border-[oklch(0.80_0.038_88.5)]/40" />
                <Pagination meta={groups} />
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent className="border-[oklch(0.80_0.038_88.5)]/40 bg-[oklch(0.98_0.005_85.0)] sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100">
                            <Trash2 className="size-6 text-rose-600" />
                        </div>
                        <DialogTitle className="mt-2 text-center font-serif text-xl font-bold text-[oklch(0.48_0.032_195.5)]">
                            Hapus Grup Opsi
                        </DialogTitle>
                        <DialogDescription className="text-center text-slate-500">
                            Apakah Anda yakin ingin menghapus grup opsi <span className="font-semibold text-[oklch(0.48_0.032_195.5)]">{deleteConfirm?.name}</span>? Semua item di dalamnya juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirm(null)}
                            className="border border-[oklch(0.80_0.038_88.5)]/40 text-slate-600 hover:bg-[oklch(0.80_0.038_88.5)]/10"
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            disabled={processing}
                            className="bg-rose-700 text-white hover:bg-rose-800"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

OptionGroupsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Grup Opsi', href: '/admin/option-groups' },
    ],
};

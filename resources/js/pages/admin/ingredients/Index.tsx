import { Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, PackageSearch, Pencil, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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

interface Ingredient {
    id: number;
    name: string;
    unit: string;
    cost_per_unit: string | number;
    current_stock: string | number;
    min_stock: string | number;
    is_active: boolean;
}

interface StockSummary {
    total_ingredients: number;
    total_stock_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
}

interface IngredientForm {
    id?: number;
    name: string;
    unit: string;
    cost_per_unit: string;
    min_stock: string;
    is_active: boolean;
}

interface Props {
    ingredients: {
        data: Ingredient[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: { search?: string; is_active?: string; low_stock?: string };
    summary: StockSummary;
}

const emptyForm: IngredientForm = {
    name: '',
    unit: 'kg',
    cost_per_unit: '0',
    min_stock: '0',
    is_active: true,
};

export default function IngredientsIndex({
    ingredients,
    filters,
    summary,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(
        filters.is_active ?? 'all',
    );
    const [formOpen, setFormOpen] = useState(false);
    const [opnameTarget, setOpnameTarget] = useState<Ingredient | null>(null);
    const [editing, setEditing] = useState<IngredientForm>(emptyForm);
    const [physicalQty, setPhysicalQty] = useState('');

    const form = useForm<IngredientForm>({ ...emptyForm });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                search !== (filters.search ?? '') ||
                statusFilter !== (filters.is_active ?? 'all')
            ) {
                router.get(
                    '/admin/ingredients',
                    {
                        search: search || undefined,
                        is_active:
                            statusFilter !== 'all' ? statusFilter : undefined,
                    },
                    { preserveScroll: true, preserveState: true },
                );
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [search, statusFilter]);

    function openCreate() {
        setEditing(emptyForm);
        form.setData({ ...emptyForm });
        setFormOpen(true);
    }

    function openEdit(ingredient: Ingredient) {
        const data: IngredientForm = {
            id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            cost_per_unit: String(ingredient.cost_per_unit),
            min_stock: String(ingredient.min_stock),
            is_active: ingredient.is_active,
        };
        setEditing(data);
        form.setData(data);
        setFormOpen(true);
    }

    function submitForm(e: React.FormEvent) {
        e.preventDefault();
        if (editing.id) {
            form.put(`/admin/ingredients/${editing.id}`, {
                onSuccess: () => setFormOpen(false),
            });
        } else {
            form.post('/admin/ingredients', {
                onSuccess: () => setFormOpen(false),
            });
        }
    }

    function submitOpname(e: React.FormEvent) {
        e.preventDefault();
        if (!opnameTarget) return;

        router.post(
            '/admin/ingredients/stock-opname',
            {
                ingredient_id: opnameTarget.id,
                physical_qty: physicalQty,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpnameTarget(null);
                    setPhysicalQty('');
                },
            },
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Bahan Baku - Inventory" />

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <PackageSearch className="size-3.5 text-[#4F6B6A]" />
                            <span>Manajemen Persediaan</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Bahan Baku
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola stok bahan baku untuk perhitungan HPP yang
                            akurat.
                        </p>
                    </div>

                    <Button onClick={openCreate}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">
                            Bahan Baku
                        </span>
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Total Item
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                {summary.total_ingredients}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Nilai Stok
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp{' '}
                                {Number(
                                    summary.total_stock_value,
                                ).toLocaleString('id-ID', {
                                    maximumFractionDigits: 0,
                                })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                <AlertTriangle className="size-3" /> Stok
                                Menipis
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-amber-700">
                                {summary.low_stock_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-rose-600 uppercase">
                                <AlertTriangle className="size-3" /> Stok
                                Habis
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-rose-700">
                                {summary.out_of_stock_count}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#CFC0A4]" />
                        <Input
                            placeholder="Cari bahan baku..."
                            className="border-[#CFC0A4]/50 bg-white pl-9 focus-visible:border-[#4F6B6A]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="1">Aktif</SelectItem>
                            <SelectItem value="0">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Stok
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Min Stok
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        HPP / Unit
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Nilai
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.data.map((ing) => {
                                    const isLow =
                                        Number(ing.current_stock) <=
                                        Number(ing.min_stock);
                                    return (
                                        <tr
                                            key={ing.id}
                                            className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50"
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-slate-800">
                                                    {ing.name}
                                                </span>
                                                {!ing.is_active && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="ml-2 text-xs"
                                                    >
                                                        Nonaktif
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        isLow
                                                            ? 'font-semibold text-rose-600'
                                                            : 'text-slate-700'
                                                    }
                                                >
                                                    {Number(
                                                        ing.current_stock,
                                                    ).toLocaleString('id-ID')}{' '}
                                                    {ing.unit}
                                                </span>
                                                {isLow && (
                                                    <AlertTriangle className="ml-1 inline size-3.5 text-rose-500" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {Number(
                                                    ing.min_stock,
                                                ).toLocaleString('id-ID')}{' '}
                                                {ing.unit}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                Rp{' '}
                                                {Number(
                                                    ing.cost_per_unit,
                                                ).toLocaleString('id-ID', {
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                Rp{' '}
                                                {(
                                                    Number(ing.cost_per_unit) *
                                                    Number(ing.current_stock)
                                                ).toLocaleString('id-ID', {
                                                    maximumFractionDigits: 0,
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mr-1 h-8 border-[#CFC0A4]/50 text-xs hover:bg-[#CFC0A4]/10"
                                                    onClick={() =>
                                                        setOpnameTarget(ing)
                                                    }
                                                >
                                                    Opname
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() =>
                                                        openEdit(ing)
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {ingredients.data.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">
                                Belum Ada Bahan Baku
                            </h4>
                            <p className="mt-1 text-xs text-slate-500 italic">
                                Tambahkan bahan baku pertama Anda untuk mulai
                                mengelola stok.
                            </p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={ingredients} />
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            {editing.id ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                        </DialogTitle>
                        <DialogDescription>
                            {editing.id
                                ? 'Perbarui informasi bahan baku.'
                                : 'Daftarkan bahan baku baru ke persediaan.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitForm} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                            />
                            {form.errors.name && (
                                <p className="text-xs text-rose-600">
                                    {form.errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="unit">Satuan</Label>
                                <Input
                                    id="unit"
                                    placeholder="kg / pcs / liter"
                                    value={form.data.unit}
                                    onChange={(e) =>
                                        form.setData('unit', e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cost">HPP per Unit</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={form.data.cost_per_unit}
                                    onChange={(e) =>
                                        form.setData(
                                            'cost_per_unit',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="min_stock">Min Stok (Alert)</Label>
                            <Input
                                id="min_stock"
                                type="number"
                                step="any"
                                min="0"
                                value={form.data.min_stock}
                                onChange={(e) =>
                                    form.setData('min_stock', e.target.value)
                                }
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setFormOpen(false)}
                                className="border border-[#CFC0A4]/40"
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Stock Opname Dialog */}
            <Dialog
                open={!!opnameTarget}
                onOpenChange={(open) => !open && setOpnameTarget(null)}
            >
                <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            Stock Opname
                        </DialogTitle>
                        <DialogDescription>
                            Hitung fisik{' '}
                            <span className="font-semibold text-[#4F6B6A]">
                                {opnameTarget?.name}
                            </span>
                            . Sistem akan mencatat selisih otomatis.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitOpname} className="space-y-4">
                        <div className="rounded-lg border border-[#CFC0A4]/40 bg-white px-4 py-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Stok sistem:
                                </span>
                                <span className="font-medium">
                                    {opnameTarget
                                        ? Number(
                                              opnameTarget.current_stock,
                                          ).toLocaleString('id-ID')
                                        : ''}{' '}
                                    {opnameTarget?.unit}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="physical_qty">
                                Jumlah Fisik ({opnameTarget?.unit})
                            </Label>
                            <Input
                                id="physical_qty"
                                type="number"
                                step="any"
                                min="0"
                                value={physicalQty}
                                onChange={(e) =>
                                    setPhysicalQty(e.target.value)
                                }
                                required
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpnameTarget(null)}
                                className="border border-[#CFC0A4]/40"
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={!physicalQty}>
                                Simpan Opname
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

IngredientsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Bahan Baku', href: '/admin/ingredients' },
    ],
};

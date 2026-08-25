import { Head, router } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, PackageSearch, Scale, Trash2 } from 'lucide-react';
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

interface IngredientOption {
    id: number;
    name: string;
    unit: string;
}

interface Movement {
    id: number;
    type: string;
    qty: string | number;
    unit_cost: string | number;
    total_cost: string | number;
    notes: string | null;
    created_at: string;
    ingredient?: IngredientOption & { cost_per_unit?: string };
    user?: { name: string };
}

interface StockSummary {
    total_ingredients: number;
    total_stock_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
}

interface Props {
    movements: {
        data: Movement[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    ingredients: IngredientOption[];
    filters: {
        ingredient_id?: string;
        type?: string;
        date_from?: string;
        date_to?: string;
    };
    summary: StockSummary;
}

const typeConfig: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
> = {
    in: {
        label: 'Masuk',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <ArrowDownLeft className="size-3" />,
    },
    out: {
        label: 'Keluar',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <ArrowUpRight className="size-3" />,
    },
    adjustment: {
        label: 'Penyesuaian',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <Scale className="size-3" />,
    },
    waste: {
        label: 'Waste',
        className: 'bg-rose-100 text-rose-700 border-rose-200',
        icon: <Trash2 className="size-3" />,
    },
    transfer: {
        label: 'Transfer',
        className: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: <ArrowUpRight className="size-3" />,
    },
};

export default function StockMovements({
    movements,
    ingredients,
    filters,
    summary,
}: Props) {
    const [typeFilter, setTypeFilter] = useState(filters.type ?? 'all');
    const [ingredientFilter, setIngredientFilter] = useState(
        filters.ingredient_id ?? 'all',
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [wasteOpen, setWasteOpen] = useState(false);
    const [wasteIngredient, setWasteIngredient] = useState('');
    const [wasteQty, setWasteQty] = useState('');
    const [wasteReason, setWasteReason] = useState('spoil');
    const [wasteNotes, setWasteNotes] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                '/admin/stock/movements',
                {
                    type: typeFilter !== 'all' ? typeFilter : undefined,
                    ingredient_id:
                        ingredientFilter !== 'all' ? ingredientFilter : undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                },
                { preserveScroll: true, preserveState: true },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [typeFilter, ingredientFilter, dateFrom, dateTo]);

    function submitWaste(e: React.FormEvent) {
        e.preventDefault();

        router.post(
            '/admin/stock/waste',
            {
                ingredient_id: wasteIngredient,
                qty: wasteQty,
                reason: wasteReason,
                notes: wasteNotes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setWasteOpen(false);
                    setWasteQty('');
                    setWasteNotes('');
                },
            },
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Riwayat Stok - Inventory" />

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <PackageSearch className="size-3.5 text-[#4F6B6A]" />
                            <span>Kartu Stok</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Riwayat Pergerakan Stok
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Semua pergerakan stok masuk, keluar, penyesuaian,
                            dan waste.
                        </p>
                    </div>

                    <Button onClick={() => setWasteOpen(true)}>
                        <Trash2 className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Catat Waste</span>
                    </Button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Nilai Stok Saat Ini
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp{' '}
                                {Number(summary.total_stock_value).toLocaleString('id-ID', {
                                    maximumFractionDigits: 0,
                                })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                Stok Menipis
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-amber-700">
                                {summary.low_stock_count}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-rose-600 uppercase">
                                Stok Habis
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-rose-700">
                                {summary.out_of_stock_count}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-40 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua tipe" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="in">Masuk</SelectItem>
                            <SelectItem value="out">Keluar</SelectItem>
                            <SelectItem value="adjustment">Penyesuaian</SelectItem>
                            <SelectItem value="waste">Waste</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={ingredientFilter}
                        onValueChange={setIngredientFilter}
                    >
                        <SelectTrigger className="w-52 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua bahan" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Bahan</SelectItem>
                            {ingredients.map((ing) => (
                                <SelectItem key={ing.id} value={String(ing.id)}>
                                    {ing.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        type="date"
                        className="w-40 border-[#CFC0A4]/50 bg-white"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <span className="text-xs text-slate-400">s/d</span>
                    <Input
                        type="date"
                        className="w-40 border-[#CFC0A4]/50 bg-white"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>

                {/* Movements Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Waktu
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Tipe
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Bahan
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Qty
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Biaya
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Catatan
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Oleh
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.data.map((m) => {
                                    const cfg =
                                        typeConfig[m.type] ?? typeConfig.out;
                                    const qty = Number(m.qty);
                                    return (
                                        <tr
                                            key={m.id}
                                            className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                                {new Date(m.created_at).toLocaleString(
                                                    'id-ID',
                                                    {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    },
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={`${cfg.className} gap-1`}
                                                >
                                                    {cfg.icon}
                                                    {cfg.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {m.ingredient?.name ?? '-'}
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right font-medium ${
                                                    qty >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                }`}
                                            >
                                                {qty > 0 ? '+' : ''}
                                                {qty.toLocaleString('id-ID')}{' '}
                                                {m.ingredient?.unit}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                Rp{' '}
                                                {Number(m.total_cost).toLocaleString('id-ID', {
                                                    maximumFractionDigits: 0,
                                                })}
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-500 italic">
                                                {m.notes ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">
                                                {m.user?.name ?? 'Sistem'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {movements.data.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">
                                Belum Ada Pergerakan
                            </h4>
                            <p className="mt-1 text-xs text-slate-500 italic">
                                Ubah filter atau catat transaksi stok pertama.
                            </p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={movements} />
                </div>
            </div>

            {/* Waste Dialog */}
            <Dialog open={wasteOpen} onOpenChange={setWasteOpen}>
                <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            Catat Waste / Kerusakan
                        </DialogTitle>
                        <DialogDescription>
                            Stok akan dikurangi dan biaya tercatat di laporan
                            COGS.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitWaste} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Bahan Baku</Label>
                            <Select
                                value={wasteIngredient}
                                onValueChange={setWasteIngredient}
                                required
                            >
                                <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                    <SelectValue placeholder="Pilih bahan baku" />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    {ingredients.map((ing) => (
                                        <SelectItem key={ing.id} value={String(ing.id)}>
                                            {ing.name} ({ing.unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="waste_qty">Jumlah</Label>
                                <Input
                                    id="waste_qty"
                                    type="number"
                                    step="any"
                                    min="0.0001"
                                    value={wasteQty}
                                    onChange={(e) => setWasteQty(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Alasan</Label>
                                <Select
                                    value={wasteReason}
                                    onValueChange={setWasteReason}
                                >
                                    <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        <SelectItem value="spoil">Busuk/Rusak</SelectItem>
                                        <SelectItem value="expired">Kedaluwarsa</SelectItem>
                                        <SelectItem value="prep_error">
                                            Kesalahan Persiapan
                                        </SelectItem>
                                        <SelectItem value="overcook">Terlalu Matang</SelectItem>
                                        <SelectItem value="other">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="waste_notes">Catatan (opsional)</Label>
                            <Input
                                id="waste_notes"
                                value={wasteNotes}
                                onChange={(e) => setWasteNotes(e.target.value)}
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setWasteOpen(false)}
                                className="border border-[#CFC0A4]/40"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={!wasteIngredient || !wasteQty}
                                className="bg-rose-700 hover:bg-rose-800"
                            >
                                Catat Waste
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

StockMovements.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Bahan Baku', href: '/admin/ingredients' },
        { title: 'Riwayat Stok', href: '/admin/stock/movements' },
    ],
};

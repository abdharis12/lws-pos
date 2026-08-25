import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Plus, Send, ShoppingCart, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
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

interface Supplier {
    id: number;
    name: string;
}

interface IngredientOption {
    id: number;
    name: string;
    unit: string;
    cost_per_unit: string | number;
}

interface PoItem {
    id: number;
    ingredient_id: number;
    qty_ordered: string | number;
    qty_received: string | number;
    unit_cost: string | number;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    status: string;
    order_date: string;
    expected_date: string | null;
    total_amount: string | number;
    supplier?: Supplier;
}

interface Props {
    purchaseOrders: {
        data: PurchaseOrder[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    suppliers: Supplier[];
    ingredients: IngredientOption[];
    filters: { status?: string; supplier_id?: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    sent: { label: 'Dikirim', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    partial: { label: 'Sebagian', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    received: { label: 'Diterima', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Batal', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

interface LineItem {
    ingredient_id: string;
    qty_ordered: string;
    unit_cost: string;
}

export default function PurchaseOrders({
    purchaseOrders,
    suppliers,
    ingredients,
    filters,
}: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [createOpen, setCreateOpen] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<LineItem[]>([
        { ingredient_id: '', qty_ordered: '', unit_cost: '' },
    ]);

    function addLine() {
        setLines((prev) => [
            ...prev,
            { ingredient_id: '', qty_ordered: '', unit_cost: '' },
        ]);
    }

    function removeLine(index: number) {
        setLines((prev) => prev.filter((_, i) => i !== index));
    }

    function updateLine(index: number, field: keyof LineItem, value: string) {
        setLines((prev) =>
            prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
        );
    }

    function selectIngredient(index: number, ingredientId: string) {
        const ing = ingredients.find((i) => String(i.id) === ingredientId);
        setLines((prev) =>
            prev.map((line, i) =>
                i === index
                    ? {
                          ...line,
                          ingredient_id: ingredientId,
                          unit_cost: ing ? String(ing.cost_per_unit) : line.unit_cost,
                      }
                    : line,
            ),
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        router.post(
            '/admin/procurement/pos',
            {
                supplier_id: supplierId,
                expected_date: expectedDate || null,
                notes: notes || null,
                items: lines
                    .filter((l) => l.ingredient_id && Number(l.qty_ordered) > 0)
                    .map((l) => ({
                        ingredient_id: l.ingredient_id,
                        qty_ordered: l.qty_ordered,
                        unit_cost: l.unit_cost || '0',
                    })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateOpen(false);
                    resetForm();
                },
            },
        );
    }

    function resetForm() {
        setSupplierId('');
        setExpectedDate('');
        setNotes('');
        setLines([{ ingredient_id: '', qty_ordered: '', unit_cost: '' }]);
    }

    function sendPo(poId: number) {
        router.post(`/admin/procurement/pos/${poId}/send`, {}, { preserveScroll: true });
    }

    function cancelPo(poId: number) {
        router.post(`/admin/procurement/pos/${poId}/cancel`, {}, { preserveScroll: true });
    }

    const totalEstimate = lines.reduce(
        (sum, l) => sum + Number(l.qty_ordered || 0) * Number(l.unit_cost || 0),
        0,
    );

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Purchase Order - Procurement" />

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ShoppingCart className="size-3.5 text-[#4F6B6A]" />
                            <span>Pengadaan Barang</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Purchase Order
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola pemesanan bahan baku ke supplier.
                        </p>
                    </div>

                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">PO Baru</span>
                    </Button>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Dikirim</SelectItem>
                            <SelectItem value="partial">Sebagian</SelectItem>
                            <SelectItem value="received">Diterima</SelectItem>
                            <SelectItem value="cancelled">Batal</SelectItem>
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
                                        No. PO
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Supplier
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Tanggal
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseOrders.data.map((po) => {
                                    const cfg = statusConfig[po.status] ?? statusConfig.draft;
                                    return (
                                        <tr
                                            key={po.id}
                                            className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50"
                                        >
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {po.po_number}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {po.supplier?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                                {new Date(po.order_date).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                Rp{' '}
                                                {Number(po.total_amount).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cfg.className}>
                                                    {cfg.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {(po.status === 'draft' ||
                                                    po.status === 'partial') && (
                                                    <>
                                                        {po.status === 'draft' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="mr-1 h-8 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50"
                                                                onClick={() => sendPo(po.id)}
                                                            >
                                                                <Send className="mr-1 size-3" /> Kirim
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                                            onClick={() => cancelPo(po.id)}
                                                        >
                                                            <XCircle className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {po.status === 'received' && (
                                                    <CheckCircle2 className="ml-auto inline size-5 text-emerald-500" />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {purchaseOrders.data.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">
                                Belum Ada PO
                            </h4>
                            <p className="mt-1 text-xs text-slate-500 italic">
                                Buat PO pertama untuk memesan bahan baku.
                            </p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={purchaseOrders} />
                </div>
            </div>

            {/* Create PO Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            Buat Purchase Order
                        </DialogTitle>
                        <DialogDescription>
                            Pilih supplier dan tambahkan item yang dipesan.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Supplier</Label>
                                <Select value={supplierId} onValueChange={setSupplierId} required>
                                    <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                        <SelectValue placeholder="Pilih supplier" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expected">Tanggal Diharapkan</Label>
                                <Input
                                    id="expected"
                                    type="date"
                                    className="border-[#CFC0A4]/50 bg-white"
                                    value={expectedDate}
                                    onChange={(e) => setExpectedDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Item Pesanan</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 border-[#CFC0A4]/50 text-xs"
                                    onClick={addLine}
                                >
                                    <Plus className="mr-1 size-3" /> Baris
                                </Button>
                            </div>

                            {lines.map((line, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Select
                                        value={line.ingredient_id}
                                        onValueChange={(v) => selectIngredient(idx, v)}
                                        required
                                    >
                                        <SelectTrigger className="flex-1 border-[#CFC0A4]/50 bg-white">
                                            <SelectValue placeholder="Pilih bahan" />
                                        </SelectTrigger>
                                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                            {ingredients.map((ing) => (
                                                <SelectItem key={ing.id} value={String(ing.id)}>
                                                    {ing.name} ({ing.unit})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0.0001"
                                        placeholder="Qty"
                                        className="w-24 border-[#CFC0A4]/50 bg-white"
                                        value={line.qty_ordered}
                                        onChange={(e) =>
                                            updateLine(idx, 'qty_ordered', e.target.value)
                                        }
                                        required
                                    />
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        placeholder="Harga"
                                        className="w-28 border-[#CFC0A4]/50 bg-white"
                                        value={line.unit_cost}
                                        onChange={(e) =>
                                            updateLine(idx, 'unit_cost', e.target.value)
                                        }
                                    />
                                    {lines.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-rose-600 hover:bg-rose-100"
                                            onClick={() => removeLine(idx)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="po_notes">Catatan</Label>
                            <Input
                                id="po_notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Catatan untuk supplier..."
                            />
                        </div>

                        <div className="rounded-lg border border-[#CFC0A4]/40 bg-white px-4 py-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Total Estimasi:</span>
                                <span className="font-serif text-lg font-bold text-[#4F6B6A]">
                                    Rp {totalEstimate.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setCreateOpen(false)}
                                className="border border-[#CFC0A4]/40"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={!supplierId || totalEstimate <= 0}
                            >
                                Simpan PO
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

PurchaseOrders.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Procurement', href: '/admin/procurement/pos' },
        { title: 'Purchase Order', href: '/admin/procurement/pos' },
    ],
};

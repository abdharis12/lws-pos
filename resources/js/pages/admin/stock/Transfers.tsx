import { Head, router } from '@inertiajs/react';
import { ArrowLeftRight, CheckCircle2, Clock, Plus, Send, Truck, XCircle } from 'lucide-react';
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

interface Outlet {
    id: number;
    name: string;
}

interface IngredientOption {
    id: number;
    name: string;
    unit: string;
}

interface Transfer {
    id: number;
    transfer_number: string;
    status: string;
    requested_date: string;
    approved_date: string | null;
    shipped_date: string | null;
    received_date: string | null;
    items_count: number;
    outlet_from?: Outlet;
    outlet_to?: Outlet;
    requested_by?: { name: string };
}

interface LineItem {
    ingredient_id: string;
    qty_requested: string;
}

interface Props {
    transfers: {
        data: Transfer[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    outlets: Outlet[];
    ingredients: IngredientOption[];
    filters: { status?: string; date_from?: string; date_to?: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
    requested: { label: 'Diminta', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { label: 'Disetujui', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    shipped: { label: 'Dikirim', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    received: { label: 'Diterima', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Batal', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function StockTransfers({ transfers, outlets, ingredients, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [createOpen, setCreateOpen] = useState(false);
    const [outletTo, setOutletTo] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<LineItem[]>([{ ingredient_id: '', qty_requested: '' }]);

    const summary = {
        total: transfers.total,
        pending: transfers.data.filter((t) => t.status === 'requested').length,
        in_transit: transfers.data.filter((t) => t.status === 'shipped').length,
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                '/admin/stock/transfers',
                {
                    status: statusFilter !== 'all' ? statusFilter : undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                },
                { preserveScroll: true, preserveState: true },
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [statusFilter, dateFrom, dateTo]);

    function addLine() {
        setLines((prev) => [...prev, { ingredient_id: '', qty_requested: '' }]);
    }

    function removeLine(index: number) {
        setLines((prev) => prev.filter((_, i) => i !== index));
    }

    function updateLine(index: number, field: keyof LineItem, value: string) {
        setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        router.post(
            '/admin/stock/transfers',
            {
                outlet_to: outletTo,
                notes: notes || null,
                items: lines
                    .filter((l) => l.ingredient_id && Number(l.qty_requested) > 0)
                    .map((l) => ({
                        ingredient_id: l.ingredient_id,
                        qty_requested: l.qty_requested,
                    })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateOpen(false);
                    setOutletTo('');
                    setNotes('');
                    setLines([{ ingredient_id: '', qty_requested: '' }]);
                },
            },
        );
    }

    function approveTransfer(id: number) {
        router.post(`/admin/stock/transfers/${id}/approve`, {}, { preserveScroll: true });
    }

    function shipTransfer(id: number) {
        router.post(`/admin/stock/transfers/${id}/ship`, {}, { preserveScroll: true });
    }

    function cancelTransfer(id: number) {
        router.post(`/admin/stock/transfers/${id}/cancel`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Stock Transfer - Inventory" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ArrowLeftRight className="size-3.5 text-[#4F6B6A]" />
                            <span>Inventory</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Stock Transfer
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Transfer bahan baku antar outlet.
                        </p>
                    </div>

                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">Transfer Baru</span>
                    </Button>
                </div>

                {/* Summary */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Total Transfer
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                {summary.total}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-amber-600 uppercase">
                                <Clock className="size-3" /> Pending Approval
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-amber-700">
                                {summary.pending}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-purple-200 bg-purple-50/50 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="flex items-center gap-1 text-[10px] font-medium tracking-wider text-purple-600 uppercase">
                                <Truck className="size-3" /> Dalam Perjalanan
                            </p>
                            <p className="mt-1 font-serif text-2xl font-bold text-purple-700">
                                {summary.in_transit}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-44 border-[#CFC0A4]/50 bg-white">
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="requested">Diminta</SelectItem>
                            <SelectItem value="approved">Disetujui</SelectItem>
                            <SelectItem value="shipped">Dikirim</SelectItem>
                            <SelectItem value="received">Diterima</SelectItem>
                            <SelectItem value="cancelled">Batal</SelectItem>
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

                {/* Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        No. Transfer
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Dari Outlet
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Ke Outlet
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Item
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Tanggal
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
                                {transfers.data.map((t) => {
                                    const cfg = statusConfig[t.status] ?? statusConfig.requested;

                                    return (
                                        <tr key={t.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3">
                                                <a
                                                    href={`/admin/stock/transfers/${t.id}`}
                                                    className="font-medium text-[#4F6B6A] hover:underline"
                                                >
                                                    {t.transfer_number}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">{t.outlet_from?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-slate-700">{t.outlet_to?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-center text-slate-600">{t.items_count} item</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                                {new Date(t.requested_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {t.status === 'requested' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="mr-1 h-8 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => approveTransfer(t.id)}
                                                        >
                                                            <CheckCircle2 className="mr-1 size-3" /> Setuju
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 bg-rose-700 text-rose-50 hover:bg-rose-200 hover:text-rose-800"
                                                            onClick={() => cancelTransfer(t.id)}
                                                        >
                                                            <XCircle className="size-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                {t.status === 'approved' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 border-blue-300 text-xs text-blue-700 hover:bg-blue-50"
                                                        onClick={() => shipTransfer(t.id)}
                                                    >
                                                        <Send className="mr-1 size-3" /> Kirim
                                                    </Button>
                                                )}
                                                {t.status === 'received' && (
                                                    <CheckCircle2 className="ml-auto inline size-5 text-emerald-500" />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {transfers.data.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">Belum Ada Transfer</h4>
                            <p className="mt-1 text-xs text-slate-500 italic">Buat transfer stok pertama antar outlet.</p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={transfers} />
                </div>
            </div>

            {/* Create Transfer Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            Buat Stock Transfer
                        </DialogTitle>
                        <DialogDescription>
                            Pilih outlet tujuan dan tambahkan item yang akan ditransfer.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Outlet Tujuan *</Label>
                            <Select value={outletTo} onValueChange={setOutletTo} required>
                                <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                    <SelectValue placeholder="Pilih outlet tujuan" />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    {outlets.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Item Transfer</Label>
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
                                        onValueChange={(v) => updateLine(idx, 'ingredient_id', v)}
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
                                        className="w-28 border-[#CFC0A4]/50 bg-white"
                                        value={line.qty_requested}
                                        onChange={(e) => updateLine(idx, 'qty_requested', e.target.value)}
                                        required
                                    />
                                    {lines.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-rose-600 hover:bg-rose-100"
                                            onClick={() => removeLine(idx)}
                                        >
                                            <XCircle className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transfer_notes">Catatan</Label>
                            <Input
                                id="transfer_notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Catatan transfer..."
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="border border-[#CFC0A4]/40">
                                Batal
                            </Button>
                            <Button type="submit" disabled={!outletTo}>
                                Ajukan Transfer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

StockTransfers.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Stock', href: '/admin/stock/transfers' },
        { title: 'Stock Transfers', href: '/admin/stock/transfers' },
    ],
};

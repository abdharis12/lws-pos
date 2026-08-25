import { Head, router } from '@inertiajs/react';
import { PackageCheck, PackageOpen } from 'lucide-react';
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

interface GrnItem {
    id: number;
    ingredient_id: number;
    qty_ordered: string | number;
    qty_received: string | number;
    unit_cost: string | number;
}

interface Grn {
    id: number;
    grn_number: string;
    status: string;
    received_date: string;
    notes: string | null;
    purchaseOrder?: { po_number: string; supplier?: { name: string } };
    items?: GrnItem[];
}

interface PoIngredient {
    id: number;
    ingredient_id: number;
    name: string;
    unit: string;
    qty_ordered: string | number;
    qty_received: string | number;
    unit_cost: string | number;
}

interface PendingPo {
    id: number;
    po_number: string;
    status: string;
    supplier?: { id: number; name: string };
    items?: PoIngredient[];
}

interface Props {
    grns: {
        data: Grn[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: { status?: string };
    pendingPos: PendingPo[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Menunggu', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    partial: { label: 'Sebagian', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function Grns({ grns, filters, pendingPos }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [selectedPoId, setSelectedPoId] = useState('');
    const [lines, setLines] = useState<
        Record<number, { qty_received: string; unit_cost: string }>
    >({});

    useEffect(() => {
        router.get(
            '/admin/procurement/grns',
            { status: statusFilter !== 'all' ? statusFilter : undefined },
            { preserveScroll: true, preserveState: true },
        );
    }, [statusFilter]);

    function openReceive() {
        setSelectedPoId('');
        setLines({});
        setReceiveOpen(true);
    }

    function selectPo(poId: string) {
        setSelectedPoId(poId);
        const po = pendingPos.find((p) => String(p.id) === poId);
        if (!po?.items) return;

        const initial: Record<number, { qty_received: string; unit_cost: string }> = {};
        for (const item of po.items) {
            initial[item.id] = {
                qty_received: String(
                    Number(item.qty_ordered) - Number(item.qty_received) || '',
                ),
                unit_cost: String(item.unit_cost),
            };
        }
        setLines(initial);
    }

    function updateLine(itemId: number, field: 'qty_received' | 'unit_cost', value: string) {
        setLines((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value },
        }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const po = pendingPos.find((p) => String(p.id) === selectedPoId);
        if (!po?.items) return;

        const items = po.items
            .filter((item) => Number(lines[item.id]?.qty_received ?? 0) > 0)
            .map((item) => ({
                ingredient_id: item.ingredient_id,
                qty_received: lines[item.id].qty_received,
                unit_cost: lines[item.id].unit_cost || String(item.unit_cost),
            }));

        if (items.length === 0) return;

        router.post(
            '/admin/procurement/grns',
            {
                po_id: po.id,
                items,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReceiveOpen(false);
                    setSelectedPoId('');
                    setLines({});
                },
            },
        );
    }

    const selectedPo = pendingPos.find((p) => String(p.id) === selectedPoId);

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Penerimaan Barang - Procurement" />

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <PackageCheck className="size-3.5 text-[#4F6B6A]" />
                            <span>Penerimaan Barang</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Goods Received Notes
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Terima barang dari supplier — stok dan HPP diperbarui
                            otomatis.
                        </p>
                    </div>

                    <Button
                        onClick={openReceive}
                        disabled={pendingPos.length === 0}
                    >
                        <PackageOpen className="size-4 text-[#CFC0A4]" />
                        <span className="font-medium tracking-wide">
                            Terima Barang
                        </span>
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
                            <SelectItem value="pending">Menunggu</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="partial">Sebagian</SelectItem>
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
                                        No. GRN
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        No. PO
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Supplier
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Tanggal Terima
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {grns.data.map((grn) => {
                                    const cfg =
                                        statusConfig[grn.status] ??
                                        statusConfig.pending;
                                    return (
                                        <tr
                                            key={grn.id}
                                            className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50"
                                        >
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {grn.grn_number}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {grn.purchaseOrder?.po_number ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {grn.purchaseOrder?.supplier?.name ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                                {new Date(grn.received_date).toLocaleDateString(
                                                    'id-ID',
                                                    {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    },
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cfg.className}>
                                                    {cfg.label}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {grns.data.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">
                                Belum Ada Penerimaan
                            </h4>
                            <p className="mt-1 text-xs text-slate-500 italic">
                                Terima barang dari PO yang sudah dikirim.
                            </p>
                        </div>
                    )}
                </Card>

                <div className="mt-4">
                    <Pagination meta={grns} />
                </div>
            </div>

            {/* Receive Dialog */}
            <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">
                            Terima Barang (GRN)
                        </DialogTitle>
                        <DialogDescription>
                            Pilih PO lalu isi jumlah yang benar-benar diterima.
                            HPP bahan baku dihitung ulang otomatis.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Purchase Order</Label>
                            <Select value={selectedPoId} onValueChange={selectPo} required>
                                <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                    <SelectValue placeholder="Pilih PO" />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    {pendingPos.map((po) => (
                                        <SelectItem key={po.id} value={String(po.id)}>
                                            {po.po_number} — {po.supplier?.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedPo?.items && selectedPo.items.length > 0 && (
                            <div className="space-y-3 rounded-lg border border-[#CFC0A4]/40 bg-white p-4">
                                <p className="text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                    Item Pesanan
                                </p>
                                {selectedPo.items.map((item) => {
                                    const ordered = Number(item.qty_ordered);
                                    const alreadyReceived = Number(item.qty_received);
                                    const pendingQty = ordered - alreadyReceived;
                                    const input = lines[item.id];
                                    const received = Number(input?.qty_received ?? 0);

                                    return (
                                        <div key={item.id} className="space-y-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                                <span className="font-medium text-slate-800">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Dipesan:{' '}
                                                    <strong>{ordered}</strong> · Tertunda:{' '}
                                                    <strong className="text-amber-600">
                                                        {pendingQty}
                                                    </strong>{' '}
                                                    {item.unit}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    max={pendingQty}
                                                    placeholder={`Diterima (maks ${pendingQty})`}
                                                    className="flex-1 border-[#CFC0A4]/50 bg-[#FAF8F4]"
                                                    value={input?.qty_received ?? ''}
                                                    onChange={(e) =>
                                                        updateLine(
                                                            item.id,
                                                            'qty_received',
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    placeholder="Harga satuan"
                                                    className="w-32 border-[#CFC0A4]/50 bg-[#FAF8F4]"
                                                    value={input?.unit_cost ?? ''}
                                                    onChange={(e) =>
                                                        updateLine(item.id, 'unit_cost', e.target.value)
                                                    }
                                                />
                                            </div>
                                            {received !== pendingQty &&
                                                received > 0 && (
                                                    <p className="text-xs text-amber-600 italic">
                                                        Partial receive — sisa{' '}
                                                        {(pendingQty - received).toLocaleString('id-ID')}{' '}
                                                        {item.unit} masih tertunda.
                                                    </p>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setReceiveOpen(false)}
                                className="border border-[#CFC0A4]/40"
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={!selectedPoId}>
                                Simpan Penerimaan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

Grns.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Procurement', href: '/admin/procurement/pos' },
        { title: 'Penerimaan Barang', href: '/admin/procurement/grns' },
    ],
};

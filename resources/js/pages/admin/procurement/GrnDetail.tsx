import { Head, router } from '@inertiajs/react';
import { ArrowLeft, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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

interface GrnItem {
    id: number;
    ingredient_id: number;
    ingredient?: IngredientOption;
    qty_ordered: string | number;
    qty_received: string | number;
    unit_cost: string | number;
    notes: string | null;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier?: Supplier;
}

interface GoodsReceivedNote {
    id: number;
    grn_number: string;
    status: string;
    received_date: string;
    notes: string | null;
    purchaseOrder?: PurchaseOrder;
    items?: GrnItem[];
    receivedBy?: { name: string };
    created_at: string;
}

interface Props {
    grn: GoodsReceivedNote;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Menunggu', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    completed: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    partial: { label: 'Sebagian', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function GrnDetail({ grn }: Props) {
    const cfg = statusConfig[grn.status] ?? statusConfig.pending;

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title={`GRN Detail - ${grn.grn_number}`} />

            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8 border-b border-[#CFC0A4]/40 pb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4 text-slate-600 hover:text-slate-800"
                        onClick={() => router.visit('/admin/procurement/grns')}
                    >
                        <ArrowLeft className="mr-2 size-4" /> Kembali
                    </Button>

                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                        <PackageCheck className="size-3.5 text-[#4F6B6A]" />
                        <span>Goods Received Note</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                        {grn.grn_number}
                    </h1>
                </div>

                {/* Status & Info */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Status
                            </p>
                            <Badge className={`mt-1 ${cfg.className}`} variant="outline">
                                {cfg.label}
                            </Badge>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                No. PO
                            </p>
                            <p className="mt-1 font-medium text-slate-800">
                                {grn.purchaseOrder?.po_number ?? '-'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Tanggal Terima
                            </p>
                            <p className="mt-1 text-slate-700">
                                {new Date(grn.received_date).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Diterima Oleh
                            </p>
                            <p className="mt-1 text-slate-700">{grn.receivedBy?.name ?? 'Sistem'}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Items */}
                <Card className="mb-8 overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9]">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Item Diterima</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Bahan Baku
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Dipesan (PO)
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Diterima
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Harga Satuan
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grn.items?.map((item) => {
                                        const qtyOrdered = Number(item.qty_ordered);
                                        const qtyReceived = Number(item.qty_received);
                                        const unitCost = Number(item.unit_cost);

                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50"
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-800">
                                                    {item.ingredient?.name ?? `#${item.ingredient_id}`}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-500">
                                                    {qtyOrdered.toLocaleString('id-ID')} {item.ingredient?.unit}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-emerald-700">
                                                    {qtyReceived.toLocaleString('id-ID')} {item.ingredient?.unit}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-700">
                                                    Rp {unitCost.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                    Rp {(qtyReceived * unitCost).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                {grn.notes && (
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9]">
                            <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Catatan</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 whitespace-pre-wrap">{grn.notes}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="mt-6 text-center text-xs text-slate-400 italic">
                    Stok dan HPP bahan baku telah diperbarui otomatis saat GRN ini disimpan.
                </div>
            </div>
        </div>
    );
}

GrnDetail.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Procurement', href: '/admin/procurement/pos' },
        { title: 'Penerimaan Barang', href: '/admin/procurement/grns' },
        { title: 'Detail', href: '' },
    ],
};
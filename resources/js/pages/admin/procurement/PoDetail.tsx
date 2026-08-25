import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, PackageCheck, Send, ShoppingCart, XCircle } from 'lucide-react';
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

interface PoItem {
    id: number;
    ingredient_id: number;
    ingredient?: IngredientOption;
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
    notes: string | null;
    supplier?: Supplier;
    items?: PoItem[];
    created_by?: { name: string };
    created_at: string;
}

interface Props {
    purchaseOrder: PurchaseOrder;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    sent: { label: 'Dikirim', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    partial: { label: 'Sebagian', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    received: { label: 'Diterima', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Batal', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

export default function PoDetail({ purchaseOrder }: Props) {
    const po = purchaseOrder;
    const cfg = statusConfig[po.status] ?? statusConfig.draft;
    const canSend = po.status === 'draft';
    const canCancel = po.status === 'draft' || po.status === 'partial';
    const canReceive = po.status === 'sent' || po.status === 'partial';

    function handleSend() {
        router.post(`/admin/procurement/pos/${po.id}/send`, {}, { preserveScroll: true });
    }

    function handleCancel() {
        router.post(`/admin/procurement/pos/${po.id}/cancel`, {}, { preserveScroll: true });
    }

    function handleReceive() {
        router.visit(`/admin/procurement/grns?po_id=${po.id}`);
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title={`PO Detail - ${po.po_number}`} />

            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <div className="mb-8 border-b border-[#CFC0A4]/40 pb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4 text-slate-600 hover:text-slate-800"
                        onClick={() => router.visit('/admin/procurement/pos')}
                    >
                        <ArrowLeft className="mr-2 size-4" /> Kembali
                    </Button>

                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                        <ShoppingCart className="size-3.5 text-[#4F6B6A]" />
                        <span>Purchase Order</span>
                    </div>
                    <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                        {po.po_number}
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
                                Supplier
                            </p>
                            <p className="mt-1 font-medium text-slate-800">{po.supplier?.name ?? '-'}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                                Tanggal Order
                            </p>
                            <p className="mt-1 text-slate-700">
                                {new Date(po.order_date).toLocaleDateString('id-ID', {
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
                                Total
                            </p>
                            <p className="mt-1 font-serif text-xl font-bold text-[#4F6B6A]">
                                Rp {Number(po.total_amount).toLocaleString('id-ID')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Items */}
                <Card className="mb-8 overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9]">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Item Pesanan</h3>
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
                                            Dipesan
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
                                    {po.items?.map((item) => {
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
                                                <td className="px-4 py-3 text-right text-slate-700">
                                                    {qtyOrdered.toLocaleString('id-ID')} {item.ingredient?.unit}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {qtyReceived.toLocaleString('id-ID')} {item.ingredient?.unit}
                                                    {qtyReceived < qtyOrdered && (
                                                        <Badge variant="secondary" className="ml-2 text-xs">
                                                            Sisa {qtyOrdered - qtyReceived}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-700">
                                                    Rp {unitCost.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                    Rp {(qtyOrdered * unitCost).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-[#CFC0A4]/30 bg-[#F6F2E9]">
                                        <td className="px-4 py-3 font-semibold text-slate-800" colSpan={4}>
                                            Total
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                                            Rp {Number(po.total_amount).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="mb-8 flex flex-wrap gap-2">
                    {canSend && (
                        <Button onClick={handleSend} className="bg-blue-700 hover:bg-blue-800">
                            <Send className="mr-2 size-4" /> Kirim ke Supplier
                        </Button>
                    )}
                    {canCancel && (
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="border-rose-300 text-rose-700 hover:bg-rose-50"
                        >
                            <XCircle className="mr-2 size-4" /> Batalkan PO
                        </Button>
                    )}
                    {canReceive && (
                        <Button onClick={handleReceive} className="bg-emerald-700 hover:bg-emerald-800">
                            <PackageCheck className="mr-2 size-4" /> Terima Barang (GRN)
                        </Button>
                    )}
                    {po.status === 'received' && (
                        <Badge variant="outline" className="flex items-center gap-1 self-center bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="size-3" /> Sudah Diterima
                        </Badge>
                    )}
                </div>

                {/* Notes */}
                {po.notes && (
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9]">
                            <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Catatan</h3>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-700 whitespace-pre-wrap">{po.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

PoDetail.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Procurement', href: '/admin/procurement/pos' },
        { title: 'Purchase Order', href: '/admin/procurement/pos' },
        { title: 'Detail', href: '' },
    ],
};
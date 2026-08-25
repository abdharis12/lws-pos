import { Head, router } from '@inertiajs/react';
import { ArrowLeftRight, CheckCircle2, Clock, Send, Truck, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Outlet {
    id: number;
    name: string;
}

interface IngredientOption {
    id: number;
    name: string;
    unit: string;
}

interface TransferItem {
    id: number;
    ingredient_id: number;
    qty_requested: number;
    qty_shipped: number | null;
    qty_received: number | null;
    unit_cost: number | null;
    ingredient?: IngredientOption;
}

interface TimelineEntry {
    status: string;
    user?: { name: string };
    date: string | null;
}

interface Transfer {
    id: number;
    transfer_number: string;
    status: string;
    notes: string | null;
    requested_date: string;
    approved_date: string | null;
    shipped_date: string | null;
    received_date: string | null;
    items: TransferItem[];
    outlet_from?: Outlet;
    outlet_to?: Outlet;
    requested_by?: { name: string };
    approved_by?: { name: string };
    shipped_by?: { name: string };
    received_by?: { name: string };
}

interface Props {
    transfer: Transfer;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    requested: { label: 'Diminta', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { label: 'Disetujui', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    shipped: { label: 'Dikirim', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    received: { label: 'Diterima', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Batal', className: 'bg-rose-100 text-rose-700 border-rose-200' },
};

const statusFlow = ['requested', 'approved', 'shipped', 'received'];

export default function TransferDetail({ transfer }: Props) {
    const cfg = statusConfig[transfer.status] ?? statusConfig.requested;

    const timeline: TimelineEntry[] = [
        { status: 'requested', user: transfer.requested_by, date: transfer.requested_date },
        { status: 'approved', user: transfer.approved_by, date: transfer.approved_date },
        { status: 'shipped', user: transfer.shipped_by, date: transfer.shipped_date },
        { status: 'received', user: transfer.received_by, date: transfer.received_date },
    ].filter((e) => e.date);

    function approveTransfer() {
        router.post(`/admin/stock/transfers/${transfer.id}/approve`, {}, { preserveScroll: true });
    }

    function shipTransfer() {
        router.post(`/admin/stock/transfers/${transfer.id}/ship`, {}, { preserveScroll: true });
    }

    function receiveTransfer() {
        router.post(`/admin/stock/transfers/${transfer.id}/receive`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title={`Transfer ${transfer.transfer_number} - Stock`} />

            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <ArrowLeftRight className="size-3.5 text-[#4F6B6A]" />
                            <span>Stock Transfer</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                                {transfer.transfer_number}
                            </h1>
                            <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            {transfer.outlet_from?.name ?? '-'} → {transfer.outlet_to?.name ?? '-'}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {transfer.status === 'requested' && (
                            <>
                                <Button onClick={approveTransfer}>
                                    <CheckCircle2 className="mr-1 size-4 text-[#CFC0A4]" /> Setujui
                                </Button>
                                <Button variant="ghost" className="border border-rose-300 text-rose-700 hover:bg-rose-50" onClick={() => router.post(`/admin/stock/transfers/${transfer.id}/cancel`, {}, { preserveScroll: true })}>
                                    Batal
                                </Button>
                            </>
                        )}
                        {transfer.status === 'approved' && (
                            <Button onClick={shipTransfer}>
                                <Send className="mr-1 size-4 text-[#CFC0A4]" /> Kirim
                            </Button>
                        )}
                        {transfer.status === 'shipped' && (
                            <Button onClick={receiveTransfer} className="bg-emerald-700 hover:bg-emerald-800">
                                <Truck className="mr-1 size-4" /> Terima
                            </Button>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <Card className="mb-6 border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Status Flow</h3>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            {statusFlow.map((s, i) => {
                                const sCfg = statusConfig[s];
                                const entry = timeline.find((t) => t.status === s);
                                const isActive = statusFlow.indexOf(transfer.status) >= i;

                                return (
                                    <div key={s} className="flex flex-1 items-center">
                                        <div className="flex flex-col items-center">
                                            <div className={`flex size-10 items-center justify-center rounded-full border-2 ${isActive ? 'border-[#4F6B6A] bg-[#4F6B6A] text-white' : 'border-slate-300 bg-slate-100 text-slate-400'}`}>
                                                {isActive ? <CheckCircle2 className="size-5" /> : <Clock className="size-5" />}
                                            </div>
                                            <p className={`mt-2 text-xs font-semibold ${isActive ? 'text-[#4F6B6A]' : 'text-slate-400'}`}>
                                                {sCfg.label}
                                            </p>
                                            {entry && entry.date && (
                                                <div className="mt-1 text-center">
                                                    <p className="text-[10px] text-slate-500">
                                                        {new Date(entry.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    {entry.user && (
                                                        <p className="flex items-center gap-1 text-[10px] text-slate-400">
                                                            <User className="size-2.5" /> {entry.user.name}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {i < statusFlow.length - 1 && (
                                            <div className={`mx-2 h-0.5 flex-1 ${isActive && statusFlow.indexOf(transfer.status) > i ? 'bg-[#4F6B6A]' : 'bg-slate-200'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Info Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardHeader className="border-b border-[#CFC0A4]/20">
                            <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Detail Transfer</h3>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">No. Transfer</span>
                                <span className="font-medium text-slate-800">{transfer.transfer_number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Dari</span>
                                <span className="font-medium text-slate-800">{transfer.outlet_from?.name ?? '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Ke</span>
                                <span className="font-medium text-slate-800">{transfer.outlet_to?.name ?? '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Catatan</span>
                                <span className="text-slate-700">{transfer.notes ?? '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items Table */}
                <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                    <CardHeader className="border-b border-[#CFC0A4]/20">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Item Transfer</h3>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                    <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Bahan</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Qty Diminta</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Qty Dikirim</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Qty Diterima</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Unit Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transfer.items.map((item) => (
                                    <tr key={item.id} className="border-b border-[#CFC0A4]/20 transition-colors hover:bg-[#F6F2E9]/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{item.ingredient?.name ?? '-'}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{Number(item.qty_requested).toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{item.qty_shipped != null ? Number(item.qty_shipped).toLocaleString('id-ID') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{item.qty_received != null ? Number(item.qty_received).toLocaleString('id-ID') : '-'}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{item.unit_cost != null ? `Rp ${Number(item.unit_cost).toLocaleString('id-ID')}` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {transfer.items.length === 0 && (
                        <div className="py-16 text-center">
                            <h4 className="font-serif text-lg font-medium text-slate-700">Tidak Ada Item</h4>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

TransferDetail.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Stock', href: '/admin/stock/transfers' },
        { title: 'Stock Transfers', href: '/admin/stock/transfers' },
        { title: 'Detail', href: '#' },
    ],
};

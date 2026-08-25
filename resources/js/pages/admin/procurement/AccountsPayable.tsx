import { Head, router } from '@inertiajs/react';
import { CheckCircle2, CreditCard, DollarSign, FileText } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Supplier { id: number; name: string; }
interface Invoice { id: number; invoice_number: string; status: string; due_date: string; total_amount: number; supplier?: Supplier; }

interface AgingBucket {
    as_of: string;
    buckets: Record<string, number>;
    total_outstanding: number;
    total_overdue: number;
    by_supplier: Array<{
        supplier_id: number;
        supplier_name: string;
        total_due: number;
        total_paid: number;
        outstanding: number;
        overdue_count: number;
    }>;
}

interface APEntry {
    id: number;
    amount_due: number;
    amount_paid: number;
    balance: number;
    due_date: string;
    status: string;
    payment_method: string | null;
    reference_number: string | null;
    supplier?: Supplier;
    supplier_invoice?: Invoice;
}

interface Props {
    tab: string;
    aging: AgingBucket;
    unpaidInvoices: APEntry[];
    pendingInvoices: Invoice[];
    pos: Array<{ id: number; po_number: string; status: string; supplier?: Supplier }>;
    recentPayments: APEntry[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
    unpaid: { label: 'Belum Bayar', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    partial: { label: 'Sebagian', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    paid: { label: 'Lunas', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    overdue: { label: 'Jatuh Tempo', className: 'bg-rose-100 text-rose-700 border-rose-200' },
    matched: { label: 'Matched', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    disputed: { label: 'Disput', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function AccountsPayableIndex({
    tab, aging, unpaidInvoices, pendingInvoices, recentPayments,
}: Props) {
    const [activeTab, setActiveTab] = useState(tab);
    const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
    const [selectedAPId, setSelectedAPId] = useState<number | null>(null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('bank_transfer');
    const [refNo, setRefNo] = useState('');

    function openPayment(apId: number, currentBalance: number) {
        setSelectedAPId(apId);
        setAmount(String(currentBalance));
        setMethod('bank_transfer');
        setRefNo('');
        setRecordPaymentOpen(true);
    }

    function submitPayment(e: React.FormEvent) {
        e.preventDefault();
        router.post('/admin/procurement/ap/payment', {
            accounts_payable_id: selectedAPId,
            amount: amount,
            method: method,
            reference_number: refNo || null,
        }, {
            preserveScroll: true,
            onSuccess: () => setRecordPaymentOpen(false),
        });
    }

    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Accounts Payable - Procurement" />

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <CreditCard className="size-3.5 text-[#4F6B6A]" />
                            <span>Procurement</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Accounts Payable
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            Kelola hutang supplier dan 3-way match invoice.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => router.visit('/admin/procurement/ap?tab=pending')}>
                            <FileText className="size-4 text-[#CFC0A4]" />
                            <span className="font-medium tracking-wide">Catat Invoice</span>
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Total Hutang</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-[#4F6B6A]">
                                Rp {aging.total_outstanding.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-amber-600 uppercase">Mendatang</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-amber-700">
                                Rp {aging.buckets.current.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-rose-200 bg-rose-50/30 shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-rose-600 uppercase">Jatuh Tempo</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-rose-700">
                                Rp {aging.total_overdue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="border-[#CFC0A4]/40 bg-white shadow-sm">
                        <CardContent className="pt-6">
                            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">Sudah Dibayar</p>
                            <p className="mt-1 font-serif text-2xl font-bold text-emerald-700">
                                Rp {aging.buckets.paid.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tab navigation */}
                <div className="mb-6 flex gap-1 border-b border-[#CFC0A4]/30">
                    {['aging', 'unpaid', 'pending', 'history'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                                activeTab === t
                                    ? 'border-b-2 border-[#4F6B6A] text-[#4F6B6A]'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {t === 'aging' ? 'Aging Report' : t === 'unpaid' ? 'Belum Dibayar' : t === 'pending' ? 'Pending Invoice' : 'Riwayat'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'aging' && (
                    <div className="space-y-6">
                        <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Aging per Supplier</h3>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {[
                                { label: 'Mendatang', key: 'current', color: 'bg-emerald-50 border-emerald-200' },
                                { label: '1-30 Hari', key: '1-30', color: 'bg-amber-50 border-amber-200' },
                                { label: '31-60 Hari', key: '31-60', color: 'bg-orange-50 border-orange-200' },
                                { label: '61-90 Hari', key: '61-90', color: 'bg-red-50 border-red-200' },
                                { label: '90+ Hari', key: '90+', color: 'bg-rose-100 border-rose-300' },
                            ].map(({ label, key, color }) => (
                                <Card key={key} className={`shadow-sm ${color}`}>
                                    <CardContent className="pt-5">
                                        <p className="text-[10px] font-medium tracking-wider text-slate-600 uppercase">{label}</p>
                                        <p className="mt-1 font-serif text-xl font-bold text-slate-800">
                                            Rp {(aging.buckets[key] ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {aging.by_supplier.length > 0 && (
                            <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                                <CardHeader className="bg-[#F6F2E9]">
                                    <h3 className="font-serif text-lg font-bold text-[#4F6B6A]">Per Supplier</h3>
                                </CardHeader>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                                <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Supplier</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total Invoice</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Terbayar</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Sisa</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Jatuh Tempo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aging.by_supplier.map((s) => (
                                                <tr key={s.supplier_id} className="border-b border-[#CFC0A4]/20 hover:bg-[#F6F2E9]/50">
                                                    <td className="px-4 py-3 font-medium text-slate-800">{s.supplier_name}</td>
                                                    <td className="px-4 py-3 text-right text-slate-700">
                                                        Rp {s.total_due.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-emerald-600">
                                                        Rp {s.total_paid.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-rose-700">
                                                        Rp {s.outstanding.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {s.overdue_count > 0 ? (
                                                            <Badge className="border-rose-300 bg-rose-50 text-xs text-rose-700">
                                                                {s.overdue_count} item
                                                            </Badge>
                                                        ) : (
                                                            <CheckCircle2 className="mx-auto size-4 text-emerald-500" />
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'unpaid' && (
                    <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Invoice</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Supplier</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Jatuh Tempo</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Terbayar</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Sisa</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unpaidInvoices.map((ap) => {
                                        const cfg = statusConfig[ap.status] ?? statusConfig.unpaid;
                                        const isOverdue = ap.status === 'overdue' || (new Date(ap.due_date) < new Date() && ap.status !== 'paid');

                                        return (
                                            <tr key={ap.id} className={`border-b border-[#CFC0A4]/20 hover:bg-[#F6F2E9]/50 ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                                                <td className="px-4 py-3 font-medium text-slate-800">
                                                    {ap.supplier_invoice?.invoice_number ?? '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">{ap.supplier?.name ?? '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {new Date(ap.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-700">
                                                    Rp {Number(ap.amount_due).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3 text-right text-emerald-600">
                                                    Rp {Number(ap.amount_paid).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-rose-700">
                                                    Rp {Number(ap.balance).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="outline" size="sm" className="h-8 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50" onClick={() => openPayment(ap.id, Number(ap.balance))}>
                                                        <DollarSign className="mr-1 size-3" /> Bayar
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {unpaidInvoices.length === 0 && (
                            <div className="py-16 text-center">
                                <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
                                <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Semua Lunas</h4>
                                <p className="mt-1 text-xs text-slate-500 italic">Tidak ada hutang yang belum dibayar.</p>
                            </div>
                        )}
                    </Card>
                )}

                {activeTab === 'pending' && (
                    <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">No. Invoice</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Supplier</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">PO Ref</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Total</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingInvoices.map((inv) => {
                                        const cfg = statusConfig[inv.status] ?? statusConfig.pending;

                                        return (
                                            <tr key={inv.id} className="border-b border-[#CFC0A4]/20 hover:bg-[#F6F2E9]/50">
                                                <td className="px-4 py-3 font-medium text-slate-800">{inv.invoice_number}</td>
                                                <td className="px-4 py-3 text-slate-700">{inv.supplier?.name ?? '-'}</td>
                                                <td className="px-4 py-3 text-slate-600">-</td>
                                                <td className="px-4 py-3 text-right text-slate-700">
                                                    Rp {Number(inv.total_amount).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {pendingInvoices.length === 0 && (
                            <div className="py-16 text-center">
                                <FileText className="mx-auto size-10 text-slate-400" />
                                <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Tidak Ada Invoice Pending</h4>
                                <p className="mt-1 text-xs text-slate-500 italic">Semua invoice sudah diproses atau belum ada invoice.</p>
                            </div>
                        )}
                    </Card>
                )}

                {activeTab === 'history' && (
                    <Card className="overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#CFC0A4]/30 bg-[#F6F2E9] text-left">
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Supplier</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Invoice</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Dibayar</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Metode</th>
                                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-[#4F6B6A] uppercase">Ref</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPayments.map((p) => (
                                        <tr key={p.id} className="border-b border-[#CFC0A4]/20 hover:bg-[#F6F2E9]/50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{p.supplier?.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{p.supplier_invoice?.invoice_number ?? '-'}</td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-600">
                                                Rp {Number(p.amount_paid).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{(p.payment_method ?? '-').toUpperCase()}</td>
                                            <td className="px-4 py-3 text-slate-500 text-xs">{p.reference_number ?? '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {recentPayments.length === 0 && (
                            <div className="py-16 text-center">
                                <CreditCard className="mx-auto size-10 text-slate-400" />
                                <h4 className="mt-2 font-serif text-lg font-medium text-slate-700">Belum Ada Riwayat Pembayaran</h4>
                            </div>
                        )}
                    </Card>
                )}
            </div>

            {/* Record Payment Dialog */}
            <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
                <DialogContent className="border-[#CFC0A4]/40 bg-[#F6F2E9] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold text-[#4F6B6A]">Catat Pembayaran</DialogTitle>
                        <DialogDescription>Isi jumlah dan metode pembayaran.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitPayment} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pay_amount">Jumlah Bayar *</Label>
                            <Input id="pay_amount" type="number" step="any" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Metode</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="w-full border-[#CFC0A4]/50 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-[#CFC0A4]/40 bg-[#F6F2E9]">
                                    <SelectItem value="bank_transfer">Transfer Bank</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="giro">Giro</SelectItem>
                                    <SelectItem value="other">Lainnya</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ref_no">Referensi</Label>
                            <Input id="ref_no" placeholder="No. Referensi / Bukti Transfer" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setRecordPaymentOpen(false)} className="border border-[#CFC0A4]/40">Batal</Button>
                            <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800">Simpan Pembayaran</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

AccountsPayableIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Procurement', href: '/admin/procurement/ap' },
        { title: 'Accounts Payable', href: '/admin/procurement/ap' },
    ],
};
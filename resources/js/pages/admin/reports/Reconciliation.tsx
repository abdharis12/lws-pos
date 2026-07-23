import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PRIMARY = '#4F6B6A';
const DARK = '#233433';

interface PaymentItem {
    id: number;
    order_id: number;
    method: string;
    gross_amount: number;
    status: string;
    created_at: string;
    order: { id: number; total: number } | null;
}

interface Summary {
    total_system: number;
    total_pending: number;
    total_failed: number;
    qris_count: number;
    cash_count: number;
    debit_count: number;
}

interface Props {
    payments: PaymentItem[];
    summary: Summary;
    startDate: string;
    endDate: string;
}

const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
        settlement: { bg: 'rgba(79,107,106,0.12)', color: PRIMARY, label: 'Sukses' },
        capture: { bg: 'rgba(79,107,106,0.12)', color: PRIMARY, label: 'Sukses' },
        pending: { bg: 'rgba(207,192,164,0.2)', color: '#CFC0A4', label: 'Pending' },
        expire: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', label: 'Expired' },
        cancel: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', label: 'Dibatalkan' },
        deny: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', label: 'Ditolak' },
        failure: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', label: 'Gagal' },
    };
    const s = styles[status] ?? { bg: 'rgba(100,100,100,0.1)', color: '#666', label: status };
    return <Badge className="font-semibold border-none" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</Badge>;
};

export default function Reconciliation({ payments, summary, startDate, endDate }: Props) {
    return (
        <>
            <Head title="Rekonsiliasi Pembayaran" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.get('/admin/reports')}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-semibold md:text-3xl" style={{ color: DARK }}>
                            Rekonsiliasi Pembayaran
                        </h1>
                        <p className="mt-1 text-sm" style={{ color: '#5c6a66' }}>
                            {startDate} s.d. {endDate}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Sukses
                            </CardTitle>
                            <CheckCircle2 className="size-4" style={{ color: PRIMARY }} />
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-2xl font-bold" style={{ color: DARK }}>
                                Rp {summary.total_system.toLocaleString('id-ID')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Pending
                            </CardTitle>
                            <Clock className="size-4" style={{ color: '#CFC0A4' }} />
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-2xl font-bold" style={{ color: '#CFC0A4' }}>
                                Rp {summary.total_pending.toLocaleString('id-ID')}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Gagal
                            </CardTitle>
                            <XCircle className="size-4" style={{ color: '#dc2626' }} />
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-2xl font-bold" style={{ color: '#dc2626' }}>
                                Rp {summary.total_failed.toLocaleString('id-ID')}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                QRIS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-xl font-bold" style={{ color: DARK }}>
                                {summary.qris_count} transaksi
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Tunai
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-xl font-bold" style={{ color: DARK }}>
                                {summary.cash_count} transaksi
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium" style={{ color: '#5c6a66' }}>
                                Kartu Debit
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="font-display text-xl font-bold" style={{ color: DARK }}>
                                {summary.debit_count} transaksi
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-display text-lg" style={{ color: DARK }}>
                            <CreditCard className="size-5" style={{ color: PRIMARY }} />
                            Riwayat Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <p className="py-4 text-center text-sm" style={{ color: '#8a968f' }}>
                                Belum ada data pembayaran.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: 'rgba(37,51,47,0.08)', color: '#5c6a66' }}>
                                            <th className="px-4 py-3 font-semibold">ID</th>
                                            <th className="px-4 py-3 font-semibold">Tanggal</th>
                                            <th className="px-4 py-3 font-semibold">Metode</th>
                                            <th className="px-4 py-3 font-semibold text-right">Jumlah</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p) => (
                                            <tr key={p.id} className="border-b last:border-0 transition-colors hover:bg-[#F6F2E9]/30" style={{ borderColor: 'rgba(37,51,47,0.06)' }}>
                                                <td className="px-4 py-3 font-medium" style={{ color: DARK }}>
                                                    #{p.order_id}
                                                </td>
                                                <td className="px-4 py-3" style={{ color: '#5c6a66' }}>
                                                    {new Date(p.created_at).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="capitalize border-none" style={{ backgroundColor: 'rgba(79,107,106,0.08)', color: PRIMARY }}>
                                                        {p.method}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold" style={{ color: DARK }}>
                                                    Rp {Number(p.gross_amount).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {statusBadge(p.status)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Reconciliation.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Rekonsiliasi', href: '/admin/reports/reconciliation' },
    ],
};

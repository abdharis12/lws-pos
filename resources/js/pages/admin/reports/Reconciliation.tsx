import { Head, router, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, XCircle, Clock, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentItem {
    id: number;
    order_id: number;
    method: string;
    gross_amount: number;
    status: string;
    created_at: string;
    order: { id: number; total: number } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
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
    payments: PaginatedData<PaymentItem>;
    summary: Summary;
    startDate: string;
    endDate: string;
}

const statusBadge = (status: string) => {
    const s: Record<string, { bg: string; color: string; label: string }> = {
        settlement: { bg: 'oklch(0.48 0.032 195.5 / 0.12)', color: 'oklch(0.48 0.032 195.5)', label: 'Sukses' },
        capture: { bg: 'oklch(0.48 0.032 195.5 / 0.12)', color: 'oklch(0.48 0.032 195.5)', label: 'Sukses' },
        pending: { bg: 'oklch(0.80 0.038 88.5 / 0.20)', color: 'oklch(0.80 0.038 88.5)', label: 'Pending' },
        expire: { bg: 'oklch(0.59 0.22 29.2 / 0.10)', color: 'oklch(0.59 0.22 29.2)', label: 'Expired' },
        cancel: { bg: 'oklch(0.59 0.22 29.2 / 0.10)', color: 'oklch(0.59 0.22 29.2)', label: 'Dibatalkan' },
        deny: { bg: 'oklch(0.59 0.22 29.2 / 0.10)', color: 'oklch(0.59 0.22 29.2)', label: 'Ditolak' },
        failure: { bg: 'oklch(0.59 0.22 29.2 / 0.10)', color: 'oklch(0.59 0.22 29.2)', label: 'Gagal' },
    };
    const st = s[status] ?? { bg: 'oklch(0.60 0.01 260 / 0.10)', color: 'oklch(0.45 0.01 260)', label: status };

    return <Badge className="border-none font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</Badge>;
};

export default function Reconciliation({ payments, summary, startDate, endDate }: Props) {
    return (
        <div className="min-h-screen bg-[oklch(0.98_0.005_85.0)] p-6 font-sans text-slate-800">
            <Head title="Rekonsiliasi Pembayaran" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[oklch(0.80_0.038_88.5)]/40 pb-6 sm:flex-row sm:items-end">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.get('/admin/reports')}
                        className="text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10"
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[oklch(0.80_0.038_88.5)]">
                            <CreditCard className="size-3.5 text-[oklch(0.48_0.032_195.5)]" />
                            <span>Rekonsiliasi</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[oklch(0.48_0.032_195.5)]">
                            Rekonsiliasi Pembayaran
                        </h1>
                        <p className="mt-1 text-sm italic text-slate-500">
                            {startDate} s.d. {endDate}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Sukses</CardTitle>
                        <CheckCircle2 className="size-4 text-[oklch(0.48_0.032_195.5)]" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-2xl font-bold text-slate-800">
                            Rp {Math.ceil(summary.total_system).toLocaleString('id-ID')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
                        <Clock className="size-4 text-[oklch(0.80_0.038_88.5)]" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-2xl font-bold text-[oklch(0.80_0.038_88.5)]">
                            Rp {Math.ceil(summary.total_pending).toLocaleString('id-ID')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Gagal</CardTitle>
                        <XCircle className="size-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-2xl font-bold text-red-600">
                            Rp {Math.ceil(summary.total_failed).toLocaleString('id-ID')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">QRIS</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-xl font-bold text-slate-800">{summary.qris_count} transaksi</div>
                    </CardContent>
                </Card>
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Tunai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-xl font-bold text-slate-800">{summary.cash_count} transaksi</div>
                    </CardContent>
                </Card>
                <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Kartu Debit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-xl font-bold text-slate-800">{summary.debit_count} transaksi</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-[oklch(0.80_0.038_88.5)]/40 bg-white/80 shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[oklch(0.80_0.038_88.5)]/20">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[oklch(0.48_0.032_195.5)]">
                        <CreditCard className="size-5 text-[oklch(0.80_0.038_88.5)]" />
                        Riwayat Pembayaran
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {payments.data.length === 0 ? (
                        <p className="py-8 text-center text-sm italic text-slate-500">
                            Belum ada data pembayaran.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[oklch(0.80_0.038_88.5)]/20 bg-[oklch(0.48_0.032_195.5)]/5 text-left text-xs uppercase tracking-wider text-[oklch(0.48_0.032_195.5)]">
                                        <th className="px-6 py-3.5 font-semibold">ID</th>
                                        <th className="px-6 py-3.5 font-semibold">Tanggal</th>
                                        <th className="px-6 py-3.5 font-semibold">Metode</th>
                                        <th className="px-6 py-3.5 font-semibold text-right">Jumlah</th>
                                        <th className="px-6 py-3.5 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[oklch(0.80_0.038_88.5)]/15">
                                    {payments.data.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="transition-colors hover:bg-[oklch(0.80_0.038_88.5)]/5"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-800">#{p.order_id}</td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(p.created_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="border-none bg-[oklch(0.48_0.032_195.5)]/10 text-[oklch(0.48_0.032_195.5)] capitalize">
                                                    {p.method}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">
                                                Rp {Math.ceil(Number(p.gross_amount)).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">{statusBadge(p.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {payments.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-[oklch(0.80_0.038_88.5)]/20 px-6 py-4">
                                    <p className="text-sm text-slate-500">
                                        Menampilkan {payments.from}–{payments.to} dari {payments.total}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {payments.links.map((link, i) => {
                                            if (link.label.includes('Previous')) {
                                                return link.url ? (
                                                    <Link key={i} href={link.url} preserveScroll preserveState>
                                                        <Button variant="ghost" size="icon" className="size-8 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10">
                                                            <ChevronLeft className="size-4" />
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button key={i} variant="ghost" size="icon" className="size-8" disabled>
                                                        <ChevronLeft className="size-4" />
                                                    </Button>
                                                );
                                            }
                                            if (link.label.includes('Next')) {
                                                return link.url ? (
                                                    <Link key={i} href={link.url} preserveScroll preserveState>
                                                        <Button variant="ghost" size="icon" className="size-8 text-[oklch(0.48_0.032_195.5)] hover:bg-[oklch(0.80_0.038_88.5)]/10">
                                                            <ChevronRight className="size-4" />
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button key={i} variant="ghost" size="icon" className="size-8" disabled>
                                                        <ChevronRight className="size-4" />
                                                    </Button>
                                                );
                                            }
                                            return link.url ? (
                                                <Link key={i} href={link.url} preserveScroll preserveState>
                                                    <Button
                                                        variant="ghost"
                                                        className={`min-w-8 h-8 px-2 text-sm ${link.active ? 'bg-[oklch(0.48_0.032_195.5)] text-white hover:bg-[oklch(0.48_0.032_195.5)]/90' : 'text-slate-700 hover:bg-[oklch(0.80_0.038_88.5)]/10'}`}
                                                    >
                                                        {link.label}
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <span key={i} className="px-2 text-sm text-slate-400">
                                                    {link.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

Reconciliation.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan', href: '/admin/reports' },
        { title: 'Rekonsiliasi', href: '/admin/reports/reconciliation' },
    ],
};

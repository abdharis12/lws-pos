import { Head, router, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    QrCode,
} from 'lucide-react';
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
        settlement: {
            bg: 'oklch(0.48 0.032 195.5 / 0.12)',
            color: 'oklch(0.48 0.032 195.5)',
            label: 'Sukses',
        },
        capture: {
            bg: 'oklch(0.48 0.032 195.5 / 0.12)',
            color: 'oklch(0.48 0.032 195.5)',
            label: 'Sukses',
        },
        pending: {
            bg: 'oklch(0.80 0.038 88.5 / 0.20)',
            color: 'oklch(0.80 0.038 88.5)',
            label: 'Pending',
        },
        expire: {
            bg: 'oklch(0.59 0.22 29.2 / 0.10)',
            color: 'oklch(0.59 0.22 29.2)',
            label: 'Expired',
        },
        cancel: {
            bg: 'oklch(0.59 0.22 29.2 / 0.10)',
            color: 'oklch(0.59 0.22 29.2)',
            label: 'Dibatalkan',
        },
        deny: {
            bg: 'oklch(0.59 0.22 29.2 / 0.10)',
            color: 'oklch(0.59 0.22 29.2)',
            label: 'Ditolak',
        },
        failure: {
            bg: 'oklch(0.59 0.22 29.2 / 0.10)',
            color: 'oklch(0.59 0.22 29.2)',
            label: 'Gagal',
        },
    };
    const st = s[status] ?? {
        bg: 'oklch(0.60 0.01 260 / 0.10)',
        color: 'oklch(0.45 0.01 260)',
        label: status,
    };

    return (
        <Badge
            className="border-none font-semibold"
            style={{ backgroundColor: st.bg, color: st.color }}
        >
            {st.label}
        </Badge>
    );
};

export default function Reconciliation({
    payments,
    summary,
    startDate,
    endDate,
}: Props) {
    return (
        <div className="min-h-screen bg-[#FAF8F4] p-6 font-sans text-slate-800">
            <Head title="Rekonsiliasi Pembayaran" />

            <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#CFC0A4]/40 pb-6 sm:flex-row sm:items-end">
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#CFC0A4] uppercase">
                            <CreditCard className="size-3.5 text-[#4F6B6A]" />
                            <span>Rekonsiliasi</span>
                        </div>
                        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#4F6B6A]">
                            Rekonsiliasi Pembayaran
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 italic">
                            {startDate} s.d. {endDate}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Sukses
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle
                                className="h-4.5 w-4.5 text-primary"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-2xl font-bold text-primary mt-5">
                            Rp{' '}
                            {Math.ceil(summary.total_system).toLocaleString(
                                'id-ID',
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Pending
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
                            <Clock
                                className="h-4.5 w-4.5 text-amber-500"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-2xl font-bold text-amber-600 mt-5">
                            Rp{' '}
                            {Math.ceil(summary.total_pending).toLocaleString(
                                'id-ID',
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                    <CardHeader className="flex flex-row items-start justify-between pt-5">
                        <CardTitle className="text-[15px] font-semibold tracking-[0.12em] text-[#4F6B6A]/70 uppercase">
                            Gagal
                        </CardTitle>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/10">
                            <XCircle
                                className="h-4.5 w-4.5 text-red-600"
                                strokeWidth={2}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-2xl font-bold text-red-600 mt-5">
                            Rp{' '}
                            {Math.ceil(summary.total_failed).toLocaleString(
                                'id-ID',
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2 bg-secondary">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-primary">
                            <QrCode className="size-4 text-primary" />
                            QRIS
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-xl font-bold text-slate-800 mt-5">
                            {summary.qris_count} transaksi
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2 bg-primary">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-secondary">
                            <CheckCircle className="size-4 text-[#CFC0A4]" />
                            Tunai
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-xl font-bold text-slate-800 mt-5">
                            {summary.cash_count} transaksi
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2 bg-blue-800">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-secondary">
                            <CreditCard className="size-4 text-secondary" />
                            Kartu Debit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="font-serif text-xl font-bold text-slate-800 mt-5">
                            {summary.debit_count} transaksi
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-[#CFC0A4]/40 bg-white shadow-sm backdrop-blur-sm">
                <CardHeader className="border-b border-[#CFC0A4]/20">
                    <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium text-[#4F6B6A]">
                        <CreditCard className="size-5 text-[#CFC0A4]" />
                        Riwayat Pembayaran
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {payments.data.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500 italic">
                            Belum ada data pembayaran.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#CFC0A4]/20 bg-[#4F6B6A]/5 text-left text-xs tracking-wider text-[#4F6B6A] uppercase">
                                        <th className="px-6 py-3.5 font-semibold">
                                            ID
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Tanggal
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Metode
                                        </th>
                                        <th className="px-6 py-3.5 text-right font-semibold">
                                            Jumlah
                                        </th>
                                        <th className="px-6 py-3.5 font-semibold">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#CFC0A4]/15">
                                    {payments.data.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="transition-colors hover:bg-[#CFC0A4]/5"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                #{p.order_id}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(
                                                    p.created_at,
                                                ).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className="border-none bg-[#4F6B6A]/10 text-[#4F6B6A] capitalize"
                                                >
                                                    {p.method}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-800">
                                                Rp{' '}
                                                {Math.ceil(
                                                    Number(p.gross_amount),
                                                ).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {statusBadge(p.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {payments.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-[#CFC0A4]/20 px-6 py-4">
                                    <p className="text-sm text-slate-500">
                                        Menampilkan {payments.from}–
                                        {payments.to} dari {payments.total}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        {payments.links.map((link, i) => {
                                            if (
                                                link.label.includes('Previous')
                                            ) {
                                                return link.url ? (
                                                    <Link
                                                        key={i}
                                                        href={link.url}
                                                        preserveScroll
                                                        preserveState
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-[#4F6B6A] hover:bg-[#CFC0A4]/10"
                                                        >
                                                            <ChevronLeft className="size-4" />
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button
                                                        key={i}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled
                                                    >
                                                        <ChevronLeft className="size-4" />
                                                    </Button>
                                                );
                                            }

                                            if (link.label.includes('Next')) {
                                                return link.url ? (
                                                    <Link
                                                        key={i}
                                                        href={link.url}
                                                        preserveScroll
                                                        preserveState
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-[#4F6B6A] hover:bg-[#CFC0A4]/10"
                                                        >
                                                            <ChevronRight className="size-4" />
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Button
                                                        key={i}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled
                                                    >
                                                        <ChevronRight className="size-4" />
                                                    </Button>
                                                );
                                            }

                                            return link.url ? (
                                                <Link
                                                    key={i}
                                                    href={link.url}
                                                    preserveScroll
                                                    preserveState
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        className={`h-8 min-w-8 px-2 text-sm ${link.active ? 'bg-[#4F6B6A] text-white hover:bg-[#4F6B6A]/90' : 'text-slate-700 hover:bg-[#CFC0A4]/10'}`}
                                                    >
                                                        {link.label}
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <span
                                                    key={i}
                                                    className="px-2 text-sm text-slate-400"
                                                >
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

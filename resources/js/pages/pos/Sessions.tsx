import { Head, router, useForm } from '@inertiajs/react';
import {
    Clock,
    User,
    Wallet,
    History,
    Eye,
    Receipt,
    Banknote,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface UserSummary {
    id: number;
    name: string;
}

interface PosSessionData {
    id: number;
    session_date: string;
    opening_balance: string;
    opened_at: string;
    closed_at: string | null;
    status: string;
    total_cash: string;
    total_non_cash: string;
    total_transactions: number;
    opened_by: UserSummary | null;
    closed_by: UserSummary | null;
}

interface ShiftSummary {
    shift_number: number;
    employee_name: string;
    start_time: string;
    end_time: string;
    total_transactions: number;
    total_cash: number;
    total_non_cash: number;
}

interface Props {
    currentSession: PosSessionData | null;
    recentSessions: PosSessionData[];
    shiftSummaries: ShiftSummary[];
}

function formatCurrency(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(num);
}

function formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(dt: string): string {
    return new Date(dt + 'T12:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatDateLong(dt: string): string {
    return new Date(dt + 'T12:00:00').toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';
const BORDER = 'oklch(0.80 0.038 88.5 / 0.35)';
const CREAM = 'oklch(0.98 0.005 85.0)';

export default function SessionsIndex({
    currentSession,
    recentSessions,
    shiftSummaries,
}: Props) {
    const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
    const [sessionOpeningBalance, setSessionOpeningBalance] = useState('');
    const [sessionProcessing, setSessionProcessing] = useState(false);
    const [closeSessionLoading, setCloseSessionLoading] = useState(false);
    const [selectedSession, setSelectedSession] =
        useState<PosSessionData | null>(null);
    const [sessionDetail, setSessionDetail] = useState<{
        session: PosSessionData;
        shift_summaries: ShiftSummary[];
    } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useForm({});

    async function handleOpenSession() {
        const balance = Number(sessionOpeningBalance);

        if (isNaN(balance) || balance < 0) {
            return;
        }

        setSessionProcessing(true);

        try {
            const res = await fetch('/pos/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({ opening_balance: balance }),
            });

            if (res.ok) {
                setSessionDialogOpen(false);
                setSessionOpeningBalance('');
                toast.success('Session berhasil dibuka');
                router.reload();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Gagal membuka session');
            }
        } catch {
            toast.error('Gagal membuka session');
        }

        setSessionProcessing(false);
    }

    async function handleCloseSession() {
        if (!currentSession) {
            return;
        }

        setCloseSessionLoading(true);

        try {
            const res = await fetch(
                `/pos/sessions/${currentSession.id}/close`,
                {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') ?? '',
                    },
                },
            );

            if (res.ok) {
                toast.success('Session berhasil ditutup');
                router.reload();
            } else {
                toast.error('Gagal menutup session');
            }
        } catch {
            toast.error('Gagal menutup session');
        }

        setCloseSessionLoading(false);
    }

    async function viewSessionDetail(session: PosSessionData) {
        setSelectedSession(session);
        setDetailLoading(true);
        setSessionDetail(null);

        try {
            const res = await fetch(`/pos/sessions/${session.id}`, {
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
            });

            if (res.ok) {
                const data = await res.json();
                setSessionDetail(data);
            }
        } catch {
            //
        }

        setDetailLoading(false);
    }

    return (
        <div
            className="min-h-screen p-4 md:p-6"
            style={{ backgroundColor: CREAM, color: '#1e293b' }}
        >
            <Head title="Shift Kasir" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p
                            className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] uppercase"
                            style={{ color: 'oklch(0.70 0.03 88.5)' }}
                        >
                            <Clock className="size-3" />
                            Kasir
                        </p>
                        <h1
                            className="mt-1 font-serif text-3xl font-bold tracking-tight"
                            style={{ color: INK }}
                        >
                            Shift Kasir
                        </h1>
                        <p
                            className="mt-0.5 text-sm italic"
                            style={{ color: 'oklch(0.60 0.02 88.5)' }}
                        >
                            Kelola session kasir dan uang awal harian
                        </p>
                    </div>
                    {!currentSession && (
                        <Button
                            onClick={() => setSessionDialogOpen(true)}
                            className="gap-2 font-serif font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                            style={{ backgroundColor: '#4F6B6A' }}
                        >
                            <Wallet className="size-4" />
                            Buka Session
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    {currentSession && (
                        <Card
                            className="overflow-hidden border-0 shadow-lg shadow-slate-900/5"
                            style={{ backgroundColor: '#fff' }}
                        >
                            <div
                                className="relative flex items-center justify-between px-6 py-4"
                                style={{ backgroundColor: INK }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                        <TrendingUp className="size-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-medium text-white/80">
                                            <span className="flex size-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                                            Session Hari Ini — Aktif
                                        </p>
                                        <p className="text-xs text-white/50">
                                            {formatDateLong(
                                                currentSession.session_date,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCloseSession}
                                    disabled={closeSessionLoading}
                                    className="gap-2 border-0 bg-white/15 font-medium text-white shadow-none backdrop-blur-sm transition-all hover:bg-white/25 disabled:opacity-50"
                                >
                                    {closeSessionLoading
                                        ? 'Menutup...'
                                        : 'Tutup Session'}
                                </Button>
                            </div>
                            <CardContent className="p-6">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="group relative overflow-hidden rounded-2xl border-[#CFC0A4]/40 bg-[#4F6B6A]/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                                        {/* Aksen garis atas */}
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />

                                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                                            <Wallet className="size-7" />
                                            Uang Awal
                                        </div>
                                        <p className="mt-2 font-serif text-xl font-bold text-primary">
                                            {formatCurrency(
                                                currentSession.opening_balance,
                                            )}
                                        </p>
                                        <p className="mt-2 flex items-center gap-1.5 text-xs text-primary">
                                            <User className="size-3" />
                                            {currentSession.opened_by?.name ??
                                                '-'}{' '}
                                            &bull;{' '}
                                            {formatTime(
                                                currentSession.opened_at,
                                            )}
                                        </p>
                                    </div>

                                    <div className="group relative overflow-hidden rounded-2xl border-[#CFC0A4]/40 bg-[#4F6B6A]/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                                        {/* Aksen garis atas */}
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                                            <Banknote className="size-7" />
                                            Total Penjualan
                                        </div>
                                        <p className="mt-2 font-serif text-xl font-bold text-primary">
                                            {formatCurrency(
                                                currentSession.total_cash ?? 0,
                                            )}
                                        </p>
                                        <p className="mt-2 text-xs text-primary">
                                            Non-tunai:{' '}
                                            {formatCurrency(
                                                currentSession.total_non_cash ??
                                                    0,
                                            )}
                                        </p>
                                    </div>

                                    <div className="group relative overflow-hidden rounded-2xl border-[#CFC0A4]/40 bg-[#4F6B6A]/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
                                        {/* Aksen garis atas */}
                                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
                                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                                            <Receipt className="size-7" />
                                            Total Transaksi
                                        </div>
                                        <p className="mt-2 font-serif text-xl font-bold text-primary">
                                            {currentSession.total_transactions ??
                                                0}
                                        </p>
                                        <p className="mt-2 text-xs text-primary">
                                            {shiftSummaries.reduce(
                                                (s, sh) =>
                                                    s + sh.total_transactions,
                                                0,
                                            )}{' '}
                                            item terjual
                                        </p>
                                    </div>
                                </div>

                                {shiftSummaries.length > 0 && (
                                    <div className="mt-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <div
                                                className="h-px flex-1"
                                                style={{
                                                    backgroundColor: BORDER,
                                                }}
                                            />
                                            <span
                                                className="flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
                                                style={{
                                                    color: 'oklch(0.60 0.03 195.5)',
                                                }}
                                            >
                                                <Clock className="size-3" />
                                                Ringkasan Shift
                                            </span>
                                            <div
                                                className="h-px flex-1"
                                                style={{
                                                    backgroundColor: BORDER,
                                                }}
                                            />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {shiftSummaries.map((s) => (
                                                <div
                                                    key={s.shift_number}
                                                    className="overflow-hidden rounded-2xl border transition-all hover:shadow-md"
                                                    style={{
                                                        borderColor: BORDER,
                                                    }}
                                                >
                                                    <div
                                                        className="flex items-center justify-between px-5 py-3"
                                                        style={{
                                                            backgroundColor:
                                                                'oklch(0.48 0.032 195.5 / 0.06)',
                                                        }}
                                                    >
                                                        <span
                                                            className="font-serif text-sm font-bold"
                                                            style={{
                                                                color: INK,
                                                            }}
                                                        >
                                                            Shift{' '}
                                                            {s.shift_number}
                                                        </span>
                                                        <span
                                                            className="rounded-full px-3 py-0.5 text-[10px] font-semibold"
                                                            style={{
                                                                backgroundColor:
                                                                    INK_LIGHT,
                                                                color: INK,
                                                            }}
                                                        >
                                                            {s.start_time} –{' '}
                                                            {s.end_time}
                                                        </span>
                                                    </div>
                                                    <div className="p-5">
                                                        <div className="mb-4 flex items-center gap-2">
                                                            <div
                                                                className="flex size-8 items-center justify-center rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        INK_LIGHT,
                                                                }}
                                                            >
                                                                <User
                                                                    className="size-4"
                                                                    style={{
                                                                        color: INK,
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <p
                                                                    className="text-sm font-medium"
                                                                    style={{
                                                                        color: INK,
                                                                    }}
                                                                >
                                                                    {
                                                                        s.employee_name
                                                                    }
                                                                </p>
                                                                <p
                                                                    className="text-[10px] tracking-wider uppercase"
                                                                    style={{
                                                                        color: 'oklch(0.60 0.03 195.5)',
                                                                    }}
                                                                >
                                                                    Kasir
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div
                                                                className="rounded-xl p-3 text-center"
                                                                style={{
                                                                    backgroundColor:
                                                                        INK_LIGHT,
                                                                }}
                                                            >
                                                                <p
                                                                    className="text-lg font-bold"
                                                                    style={{
                                                                        color: INK,
                                                                    }}
                                                                >
                                                                    {
                                                                        s.total_transactions
                                                                    }
                                                                </p>
                                                                <p
                                                                    className="text-[10px] font-medium tracking-wider uppercase"
                                                                    style={{
                                                                        color: 'oklch(0.60 0.03 195.5)',
                                                                    }}
                                                                >
                                                                    Transaksi
                                                                </p>
                                                            </div>
                                                            <div className="rounded-xl bg-emerald-50 p-3 text-center">
                                                                <p className="text-lg font-bold text-emerald-700">
                                                                    {formatCurrency(
                                                                        s.total_cash,
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] font-medium tracking-wider text-emerald-500 uppercase">
                                                                    Tunai
                                                                </p>
                                                            </div>
                                                            <div className="rounded-xl bg-sky-50 p-3 text-center">
                                                                <p className="text-lg font-bold text-sky-700">
                                                                    {formatCurrency(
                                                                        s.total_non_cash,
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] font-medium tracking-wider text-sky-500 uppercase">
                                                                    Non-tunai
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {!currentSession && (
                        <Card
                            className="overflow-hidden border-0 shadow-lg shadow-slate-900/5"
                            style={{ backgroundColor: '#fff' }}
                        >
                            <div className="flex flex-col items-center px-6 py-12 text-center">
                                <div
                                    className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: INK_LIGHT }}
                                >
                                    <Clock
                                        className="size-8"
                                        style={{ color: INK }}
                                    />
                                </div>
                                <h2
                                    className="font-serif text-xl font-bold"
                                    style={{ color: INK }}
                                >
                                    Belum Ada Session Aktif
                                </h2>
                                <p
                                    className="mt-1 max-w-sm text-sm"
                                    style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                >
                                    Buka session baru untuk mulai mencatat
                                    transaksi hari ini.
                                </p>
                                <Button
                                    onClick={() => setSessionDialogOpen(true)}
                                    className="mt-6 gap-2 font-serif font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
                                    style={{ backgroundColor: '#4F6B6A' }}
                                >
                                    <Wallet className="size-4" />
                                    Buka Session Sekarang
                                </Button>
                            </div>
                        </Card>
                    )}

                    <Card
                        className="overflow-hidden border-0 shadow-lg shadow-slate-900/5"
                        style={{ backgroundColor: '#fff' }}
                    >
                        <CardHeader
                            className="border-b px-6 py-5 border-[#CFC0A4]/20"
                        >
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex size-9 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: INK_LIGHT }}
                                >
                                    <History
                                        className="size-4.5"
                                        style={{ color: INK }}
                                    />
                                </div>
                                <div>
                                    <CardTitle
                                        className="font-serif text-lg font-bold"
                                        style={{ color: INK }}
                                    >
                                        Riwayat Session
                                    </CardTitle>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: 'oklch(0.60 0.03 88.5)',
                                        }}
                                    >
                                        {recentSessions.length} session tercatat
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentSessions.length === 0 ? (
                                <div className="flex flex-col items-center px-6 py-12 text-center">
                                    <div className="flex flex-col items-center px-6 py-12 text-center">
                                        <div
                                            className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                            style={{
                                                backgroundColor: INK_LIGHT,
                                            }}
                                        >
                                            <Receipt
                                                className="size-8"
                                                style={{ color: INK }}
                                            />
                                        </div>
                                        <h2
                                            className="font-serif text-xl font-bold"
                                            style={{ color: INK }}
                                        >
                                            Belum Ada Riwayat Session
                                        </h2>
                                        <p
                                            className="mt-1 max-w-sm text-sm"
                                            style={{
                                                color: 'oklch(0.60 0.03 88.5)',
                                            }}
                                        >
                                            Belum ada riwayat session.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr
                                                className="text-[10px] font-semibold tracking-wider uppercase"
                                                style={{
                                                    color: 'oklch(0.60 0.03 88.5)',
                                                    backgroundColor: CREAM,
                                                }}
                                            >
                                                <th className="px-6 py-3">
                                                    Tanggal
                                                </th>
                                                <th className="px-4 py-3">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3">
                                                    Uang Awal
                                                </th>
                                                <th className="px-4 py-3">
                                                    Penjualan
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    Transaksi
                                                </th>
                                                <th className="px-4 py-3">
                                                    Dibuka
                                                </th>
                                                <th className="px-4 py-3">
                                                    Ditutup
                                                </th>
                                                <th className="px-4 py-3" />
                                            </tr>
                                        </thead>
                                        <tbody
                                            className="divide-y"
                                            style={{ borderColor: BORDER }}
                                        >
                                            {recentSessions.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="transition-colors hover:bg-slate-50"
                                                    style={{
                                                        borderColor: BORDER,
                                                    }}
                                                >
                                                    <td className="px-6 py-3.5">
                                                        <span
                                                            className="font-medium"
                                                            style={{
                                                                color: INK,
                                                            }}
                                                        >
                                                            {formatDate(
                                                                s.session_date,
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                                                s.status ===
                                                                'open'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-slate-100 text-slate-500'
                                                            }`}
                                                        >
                                                            {s.status ===
                                                            'open' ? (
                                                                <CheckCircle2 className="size-3" />
                                                            ) : (
                                                                <AlertCircle className="size-3" />
                                                            )}
                                                            {s.status === 'open'
                                                                ? 'Aktif'
                                                                : 'Ditutup'}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className="px-4 py-3.5 font-medium"
                                                        style={{
                                                            color: '#334155',
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            s.opening_balance,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-semibold text-emerald-700">
                                                        {formatCurrency(
                                                            s.total_cash ?? 0,
                                                        )}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3.5 text-center font-medium"
                                                        style={{
                                                            color: '#475569',
                                                        }}
                                                    >
                                                        {s.total_transactions ??
                                                            0}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3.5 text-xs"
                                                        style={{
                                                            color: '#64748b',
                                                        }}
                                                    >
                                                        {s.opened_by?.name ??
                                                            '-'}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3.5 text-xs"
                                                        style={{
                                                            color: '#64748b',
                                                        }}
                                                    >
                                                        {s.closed_by?.name ??
                                                            '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <Button
                                                            onClick={() =>
                                                                viewSessionDetail(
                                                                    s,
                                                                )
                                                            }
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Eye className="size-3.5" />
                                                            Detail
                                                        </Button>
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
            </div>

            <Dialog
                open={sessionDialogOpen}
                onOpenChange={setSessionDialogOpen}
            >
                <DialogContent
                    className="sm:max-w-sm"
                    style={{ backgroundColor: '#fff' }}
                >
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div
                                className="flex size-10 items-center justify-center rounded-xl"
                                style={{ backgroundColor: INK_LIGHT }}
                            >
                                <Wallet
                                    className="size-5"
                                    style={{ color: INK }}
                                />
                            </div>
                            <div>
                                <DialogTitle
                                    className="font-serif text-lg font-bold"
                                    style={{ color: INK }}
                                >
                                    Buka Session Baru
                                </DialogTitle>
                                <p
                                    className="text-xs"
                                    style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                >
                                    Masukkan uang awal untuk hari ini
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <label
                                className="text-xs font-semibold tracking-wider uppercase"
                                style={{ color: 'oklch(0.60 0.03 88.5)' }}
                            >
                                Uang Awal (Rp)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={sessionOpeningBalance}
                                onChange={(e) =>
                                    setSessionOpeningBalance(e.target.value)
                                }
                                className="h-11 border-2 text-base font-medium shadow-sm transition-all focus:border-emerald-500 focus:ring-emerald-500"
                                style={{ borderColor: BORDER }}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleOpenSession}
                                disabled={
                                    sessionProcessing ||
                                    !sessionOpeningBalance ||
                                    Number(sessionOpeningBalance) < 0
                                }
                                className="flex-1 gap-2 font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                                style={{ backgroundColor: '#059669' }}
                            >
                                {sessionProcessing
                                    ? 'Menyimpan...'
                                    : 'Buka Session'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setSessionDialogOpen(false)}
                                className="flex-1 font-medium"
                                style={{
                                    borderColor: BORDER,
                                    color: '#64748b',
                                }}
                            >
                                Batal
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedSession}
                onOpenChange={(v) => {
                    if (!v) {
                        setSelectedSession(null);
                        setSessionDetail(null);
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-lg"
                    style={{ backgroundColor: '#fff' }}
                >
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div
                                className="flex size-10 items-center justify-center rounded-xl"
                                style={{ backgroundColor: INK_LIGHT }}
                            >
                                <Receipt
                                    className="size-5"
                                    style={{ color: INK }}
                                />
                            </div>
                            <div>
                                <DialogTitle
                                    className="font-serif text-lg font-bold"
                                    style={{ color: INK }}
                                >
                                    Detail Session
                                </DialogTitle>
                                <p
                                    className="text-xs"
                                    style={{ color: 'oklch(0.60 0.03 88.5)' }}
                                >
                                    {selectedSession
                                        ? formatDateLong(
                                              selectedSession.session_date,
                                          )
                                        : ''}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    {detailLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div
                                className="flex items-center gap-2 text-sm"
                                style={{ color: 'oklch(0.60 0.03 88.5)' }}
                            >
                                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Memuat...
                            </div>
                        </div>
                    ) : sessionDetail ? (
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className="rounded-xl p-4"
                                    style={{ backgroundColor: INK_LIGHT }}
                                >
                                    <p
                                        className="text-[10px] font-semibold tracking-wider uppercase"
                                        style={{
                                            color: 'oklch(0.60 0.04 195.5)',
                                        }}
                                    >
                                        Uang Awal
                                    </p>
                                    <p
                                        className="mt-1 font-serif text-xl font-bold"
                                        style={{ color: INK }}
                                    >
                                        {formatCurrency(
                                            sessionDetail.session
                                                .opening_balance,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-4">
                                    <p className="text-[10px] font-semibold tracking-wider text-emerald-600 uppercase">
                                        Penjualan Tunai
                                    </p>
                                    <p className="mt-1 font-serif text-xl font-bold text-emerald-700">
                                        {formatCurrency(
                                            sessionDetail.session.total_cash ??
                                                0,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-sky-50 p-4">
                                    <p className="text-[10px] font-semibold tracking-wider text-sky-600 uppercase">
                                        Penjualan Non-tunai
                                    </p>
                                    <p className="mt-1 font-serif text-xl font-bold text-sky-700">
                                        {formatCurrency(
                                            sessionDetail.session
                                                .total_non_cash ?? 0,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-4">
                                    <p className="text-[10px] font-semibold tracking-wider text-amber-600 uppercase">
                                        Total Transaksi
                                    </p>
                                    <p className="mt-1 font-serif text-xl font-bold text-amber-700">
                                        {sessionDetail.session
                                            .total_transactions ?? 0}
                                    </p>
                                </div>
                            </div>
                            {sessionDetail.shift_summaries.length > 0 && (
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <div
                                            className="h-px flex-1"
                                            style={{ backgroundColor: BORDER }}
                                        />
                                        <span
                                            className="text-[10px] font-semibold tracking-wider uppercase"
                                            style={{
                                                color: 'oklch(0.60 0.03 88.5)',
                                            }}
                                        >
                                            Ringkasan Shift
                                        </span>
                                        <div
                                            className="h-px flex-1"
                                            style={{ backgroundColor: BORDER }}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        {sessionDetail.shift_summaries.map(
                                            (s) => (
                                                <div
                                                    key={s.shift_number}
                                                    className="overflow-hidden rounded-xl border"
                                                    style={{
                                                        borderColor: BORDER,
                                                    }}
                                                >
                                                    <div
                                                        className="flex items-center justify-between px-4 py-2.5"
                                                        style={{
                                                            backgroundColor:
                                                                INK_LIGHT,
                                                        }}
                                                    >
                                                        <span
                                                            className="text-xs font-bold"
                                                            style={{
                                                                color: INK,
                                                            }}
                                                        >
                                                            Shift{' '}
                                                            {s.shift_number}
                                                        </span>
                                                        <span
                                                            className="text-[10px]"
                                                            style={{
                                                                color: 'oklch(0.60 0.03 88.5)',
                                                            }}
                                                        >
                                                            {s.start_time} –{' '}
                                                            {s.end_time}
                                                        </span>
                                                    </div>
                                                    <div className="p-4">
                                                        <p
                                                            className="mb-3 flex items-center gap-1.5 text-sm font-medium"
                                                            style={{
                                                                color: '#334155',
                                                            }}
                                                        >
                                                            <User
                                                                className="size-3.5"
                                                                style={{
                                                                    color: INK,
                                                                }}
                                                            />
                                                            {s.employee_name}
                                                        </p>
                                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                            <div
                                                                className="rounded-lg p-2"
                                                                style={{
                                                                    backgroundColor:
                                                                        INK_LIGHT,
                                                                }}
                                                            >
                                                                <p
                                                                    className="text-sm font-bold"
                                                                    style={{
                                                                        color: INK,
                                                                    }}
                                                                >
                                                                    {
                                                                        s.total_transactions
                                                                    }
                                                                </p>
                                                                <p className="text-[10px] text-slate-400">
                                                                    Transaksi
                                                                </p>
                                                            </div>
                                                            <div className="rounded-lg bg-emerald-50 p-2">
                                                                <p className="text-sm font-bold text-emerald-700">
                                                                    {formatCurrency(
                                                                        s.total_cash,
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] text-emerald-400">
                                                                    Tunai
                                                                </p>
                                                            </div>
                                                            <div className="rounded-lg bg-sky-50 p-2">
                                                                <p className="text-sm font-bold text-sky-700">
                                                                    {formatCurrency(
                                                                        s.total_non_cash,
                                                                    )}
                                                                </p>
                                                                <p className="text-[10px] text-sky-400">
                                                                    Non-tunai
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}

SessionsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Shift Kasir', href: '/pos/sessions' },
    ],
};

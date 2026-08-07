import { Head, router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import {
    Bell,
    ChefHat,
    CheckCircle2,
    CookingPot,
    PartyPopper,
    Sparkles,
    Store,
    User,
    UtensilsCrossed,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OrderItem {
    id: number;
    menu: { name: string };
    qty: number;
    notes: string | null;
    status?: string;
    options: { quantity: number; option_item: { name: string } }[];
}

interface Order {
    id: number;
    status: string;
    created_at: string;
    items: OrderItem[];
    subtotal?: number;
    tax?: number;
    total: number;
    customer_name: string | null;
    access_token?: string;
}

interface Props {
    table: { code: string };
    tableToken: string;
    order: Order;
}

let _fmt: Intl.NumberFormat;

function fmt(price: number) {
    _fmt ??= new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return _fmt.format(price);
}

const steps = [
    { key: 'pending_payment', label: 'Menunggu Pembayaran', icon: CheckCircle2 },
    { key: 'pending', label: 'Pesanan Diterima', icon: CheckCircle2 },
    { key: 'paid', label: 'Pembayaran Dikonfirmasi', icon: CheckCircle2 },
    { key: 'processing', label: 'Sedang Dimasak', icon: CookingPot },
    { key: 'ready', label: 'Siap Disajikan', icon: UtensilsCrossed },
];

const stepIndex: Record<string, number> = {
    pending_payment: 0,
    pending: 1,
    paid: 2,
    processing: 3,
    ready: 4,
    completed: 5,
};

const itemStatusMeta: Record<
    string,
    { label: string; tone: 'queued' | 'cooking' | 'ready' }
> = {
    pending: { label: 'Menunggu', tone: 'queued' },
    processing: { label: 'Dimasak', tone: 'cooking' },
    ready: { label: 'Siap', tone: 'ready' },
};

const statusMeta: Record<
    string,
    { title: string; subtitle: string; icon: typeof ChefHat; tone: 'progress' | 'success' | 'done' }
> = {
    pending: {
        title: 'Pesanan Diproses',
        subtitle: 'Sedang kami konfirmasi ke dapur',
        icon: ChefHat,
        tone: 'progress',
    },
    pending_payment: {
        title: 'Menunggu Pembayaran',
        subtitle: 'Selesaikan pembayaran untuk mulai dimasak',
        icon: ChefHat,
        tone: 'progress',
    },
    paid: {
        title: 'Pembayaran Dikonfirmasi',
        subtitle: 'Kabar baik! Pesanan masuk ke antrian dapur',
        icon: Sparkles,
        tone: 'progress',
    },
    processing: {
        title: 'Sedang Dimasak',
        subtitle: 'Chef sedang menyiapkan pesanan Anda',
        icon: CookingPot,
        tone: 'progress',
    },
    ready: {
        title: 'Pesanan Siap!',
        subtitle: 'Silakan ambil di meja, atau kami antarkan',
        icon: Bell,
        tone: 'success',
    },
    completed: {
        title: 'Pesanan Selesai',
        subtitle: 'Selamat menikmati, sampai jumpa lagi',
        icon: PartyPopper,
        tone: 'done',
    },
    cancelled: {
        title: 'Pesanan Dibatalkan',
        subtitle: 'Pesanan telah dibatalkan',
        icon: XCircle,
        tone: 'done',
    },
};

export default function OrderStatus({ table, tableToken, order }: Props) {
    const [currentOrder, setCurrentOrder] = useState(order);
    const [elapsed, setElapsed] = useState('0m');
    const [cancelling, setCancelling] = useState(false);

    const redirectToThankYou = useCallback((orderId: number) => {
        router.visit(`/t/${tableToken}/orders/${orderId}/thank-you`);
    }, [tableToken]);

    useEffect(() => {
        if (currentOrder.status === 'completed') {
            redirectToThankYou(currentOrder.id);
        }
    }, [currentOrder.status, currentOrder.id, redirectToThankYou]);

    useEffect(() => {
        const update = () => {
            const diff =
                Date.now() - new Date(currentOrder.created_at).getTime();
            const mins = Math.floor(diff / 60000);
            setElapsed(
                mins < 60
                    ? `${mins}m`
                    : `${Math.floor(mins / 60)}j ${mins % 60}m`,
            );
        };
        update();
        const id = setInterval(update, 30000);

        return () => clearInterval(id);
    }, [currentOrder.created_at]);

    useEffect(() => {
        const terminalStatuses = ['ready', 'completed', 'cancelled'];

        if (terminalStatuses.includes(currentOrder.status)) {
            return;
        }

        const id = setInterval(async () => {
            if (terminalStatuses.includes(currentOrder.status)) {
                return;
            }

            try {
                const res = await fetch(
                    `/t/${tableToken}/orders/${currentOrder.id}/poll-status`,
                );

                if (!res.ok) {
                    return;
                }

                const data = await res.json();
                setCurrentOrder((prev) => ({
                    ...prev,
                    status: data.status,
                    items: data.items ?? prev.items,
                    subtotal: data.subtotal ?? prev.subtotal,
                    tax: data.tax ?? prev.tax,
                    total: data.total ?? prev.total,
                }));
            } catch {
                // silent
            }
        }, 15000);

        return () => clearInterval(id);
    }, [tableToken, currentOrder.id, currentOrder.status]);

    useEchoPublic<{
        order: {
            id: number;
            status: string;
            items: OrderItem[];
            subtotal: number;
            tax: number;
            total: number;
        };
    }>(`table.${tableToken}`, '.OrderStatusUpdated', (e) => {
        if (e.order.id === currentOrder.id) {
            setCurrentOrder((prev) => ({
                ...prev,
                status: e.order.status,
                items: e.order.items ?? prev.items,
                subtotal: e.order.subtotal ?? prev.subtotal,
                tax: e.order.tax ?? prev.tax,
                total: e.order.total ?? prev.total,
            }));
        }
    });

    const current = stepIndex[currentOrder.status] ?? 0;
    const isCancelled = currentOrder.status === 'cancelled';
    const isDone =
        currentOrder.status === 'ready' || currentOrder.status === 'completed';
    const canCancel = ['pending', 'pending_payment'].includes(
        currentOrder.status,
    );
    const meta = statusMeta[currentOrder.status] ?? statusMeta.pending;
    const StatusIcon = meta.icon;

    async function handleCancel() {
        if (!window.confirm('Batalkan pesanan ini?')) {
            return;
        }

        setCancelling(true);

        try {
            const res = await fetch(`/t/${tableToken}/orders/${currentOrder.id}/cancel`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });

            if (res.ok) {
                setCurrentOrder((prev) => ({ ...prev, status: 'cancelled' }));
            }
        } catch {
            // silent
        } finally {
            setCancelling(false);
        }
    }

    return (
        <div className="font-body min-h-screen bg-[#F6F2E9]">
            <Head title="Status Pesanan">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <style>{`
                .font-display { font-family: 'Fraunces', ui-serif, Georgia, serif; }
                .font-body { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }

                @keyframes pulse-dot {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(79, 107, 106, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(79, 107, 106, 0); }
                }
                @keyframes progress-glow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes steam-rise {
                    0% { transform: translateY(0) scaleY(1); opacity: 0; }
                    15% { opacity: .55; }
                    55% { opacity: .35; }
                    100% { transform: translateY(-14px) scaleY(1.2); opacity: 0; }
                }
                @keyframes celebrate-pop {
                    0% { transform: scale(0.85); opacity: 0; }
                    60% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pulse-dot { animation: pulse-dot 2s infinite; }
                .animate-progress-glow { animation: progress-glow 2s ease-in-out infinite; }
                .animate-steam { animation: steam-rise 3.2s ease-in-out infinite; }
                .animate-celebrate { animation: celebrate-pop 0.6s cubic-bezier(0.16, 1, 0.3, 1); }

                @media (prefers-reduced-motion: reduce) {
                    .animate-pulse-dot, .animate-progress-glow, .animate-steam, .animate-celebrate { animation: none; }
                }
            `}</style>

            <section className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-[#1F3736] via-[#2A4443] to-[#3E5C58] pb-14 pt-11 sm:pt-14">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.14]"
                    style={{
                        backgroundImage:
                            'radial-gradient(#D9A441 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                    }}
                />
                <div
                    className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#D9A441]/10 blur-3xl"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-[#4F6B6A]/30 blur-3xl"
                    aria-hidden
                />

                <div className="relative mx-auto max-w-2xl px-5 text-center">
                    <div className="flex items-center justify-center gap-2 text-[#D9A441]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="font-body text-[11px] font-semibold uppercase tracking-[0.14em]">
                            Status Pesanan
                        </span>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <div
                            className={cn(
                                'relative flex h-24 w-24 items-center justify-center rounded-full shadow-xl shadow-black/20',
                                isCancelled
                                    ? 'bg-gradient-to-br from-red-400 to-red-500 shadow-red-400/30'
                                    : isDone
                                      ? 'animate-celebrate bg-gradient-to-br from-[#4F6B6A] to-[#2C4645] shadow-[#4F6B6A]/30'
                                      : 'animate-pulse-dot bg-gradient-to-br from-[#6E8C8A] to-[#4F6B6A] shadow-[#4F6B6A]/25',
                            )}
                        >
                            {!isCancelled && !isDone && (
                                <svg
                                    viewBox="0 0 60 30"
                                    className="pointer-events-none absolute -top-6 left-1/2 h-7 w-14 -translate-x-1/2 text-[#CFC0A4]"
                                    fill="none"
                                    aria-hidden
                                >
                                    <path
                                        d="M10 30 C10 15, 20 15, 18 5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        className="animate-steam"
                                        style={{ animationDelay: '0s' }}
                                    />
                                    <path
                                        d="M30 30 C30 15, 40 15, 38 5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        className="animate-steam"
                                        style={{ animationDelay: '0.6s' }}
                                    />
                                    <path
                                        d="M50 30 C50 15, 44 15, 46 5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        className="animate-steam"
                                        style={{ animationDelay: '1.2s' }}
                                    />
                                </svg>
                            )}
                            <StatusIcon
                                className={cn(
                                    'h-12 w-12 text-white',
                                    isCancelled && 'h-12 w-12',
                                )}
                            />
                        </div>
                    </div>

                    <h1 className="font-display mt-5 text-[30px] font-semibold leading-[1.1] text-[#F6F2E9] sm:text-[34px]">
                        {meta.title}
                    </h1>
                    <p className="font-body mt-2 text-sm text-[#CFC0A4]">
                        {meta.subtitle}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4F6B6A]/15 px-3 py-1 font-body text-xs font-semibold text-[#F6F2E9] ring-1 ring-white/15">
                            <Store className="h-3.5 w-3.5" />
                            Meja {table.code}
                        </span>
                        {currentOrder.customer_name && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4F6B6A]/15 px-3 py-1 font-body text-xs font-semibold text-[#F6F2E9] ring-1 ring-white/15">
                                <User className="h-3.5 w-3.5" />
                                {currentOrder.customer_name}
                            </span>
                        )}
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-1 font-mono text-xs font-semibold text-[#F6F2E9] ring-1 ring-white/15 backdrop-blur-md">
                            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#D9A441]" />
                            {elapsed}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D9A441]/20 px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-[#F6F2E9] ring-1 ring-[#D9A441]/40">
                            # Pesanan {currentOrder.id}
                        </span>
                    </div>
                </div>
            </section>

            {!isCancelled && (
                <div className="mx-auto max-w-2xl px-4 pb-2 pt-8">
                    <div className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-black/5">
                        <div className="mb-5 flex items-center justify-between">
                            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8C9C6E]">
                                Progres Pesanan
                            </p>
                            <span className="rounded-full bg-[#4F6B6A]/10 px-2.5 py-1 font-body text-[11px] font-semibold text-[#4F6B6A]">
                                {Math.min(current + 1, steps.length)} /{' '}
                                {steps.length}
                            </span>
                        </div>

                        <div className="space-y-0">
                            {steps.map((step, i) => {
                                const isAwaitingPaymentStep =
                                    step.key === 'pending_payment';
                                const hideStep =
                                    isAwaitingPaymentStep &&
                                    currentOrder.status !== 'pending_payment';

                                if (hideStep) {
                                    return null;
                                }

                                const done = i < current;
                                const active = i === current;
                                const Icon = step.icon;

                                return (
                                    <div
                                        key={step.key}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={cn(
                                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500',
                                                    done
                                                        ? 'border-[#4F6B6A] bg-[#4F6B6A] text-white'
                                                        : active
                                                          ? 'animate-pulse-dot border-[#4F6B6A] bg-[#4F6B6A]/10 text-[#4F6B6A]'
                                                          : 'border-[#CFC0A4]/50 bg-[#F6F2E9]/40 text-[#8C8577]',
                                                )}
                                            >
                                                {done ? (
                                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                                ) : (
                                                    <Icon className="h-5 w-5" />
                                                )}
                                            </div>
                                            {i < steps.length - 1 && (
                                                <div
                                                    className={cn(
                                                        'mt-1.5 h-10 w-0.5 rounded-full transition-colors duration-500',
                                                        i < current
                                                            ? 'bg-[#4F6B6A]'
                                                            : i === current
                                                              ? 'animate-progress-glow bg-gradient-to-b from-[#4F6B6A] to-[#CFC0A4]/40'
                                                              : 'bg-[#CFC0A4]/40',
                                                    )}
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col justify-center pb-8 pt-1.5">
                                            <p
                                                className={cn(
                                                    'font-body text-sm font-semibold transition-colors',
                                                    done || active
                                                        ? 'text-[#2A2620]'
                                                        : 'text-[#8C8577]',
                                                )}
                                            >
                                                {step.label}
                                            </p>
                                            {active &&
                                                currentOrder.status ===
                                                    'processing' && (
                                                    <p className="font-body mt-0.5 text-xs font-medium text-[#4F6B6A]">
                                                        Chef sedang menyiapkan
                                                        pesanan Anda
                                                    </p>
                                                )}
                                            {active &&
                                                currentOrder.status ===
                                                    'ready' && (
                                                    <p className="font-body mt-0.5 text-xs font-medium text-[#4F6B6A]">
                                                        Pesanan siap diantar!
                                                    </p>
                                                )}
                                            {active &&
                                                currentOrder.status ===
                                                    'pending_payment' && (
                                                    <p className="font-body mt-0.5 text-xs font-medium text-[#4F6B6A]">
                                                        Selesaikan pembayaran untuk
                                                        mulai dimasak
                                                    </p>
                                                )}
                                            {done && (
                                                <p className="font-body mt-0.5 text-[11px] font-medium text-[#8C9C6E]">
                                                    Selesai
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-2xl px-4 pb-2 pt-2">
                <div className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold text-[#2A2620]">
                            Pesanan Anda
                        </h3>
                        <span className="rounded-full bg-[#4F6B6A]/10 px-2.5 py-1 font-body text-xs font-semibold text-[#4F6B6A]">
                            {currentOrder.items.length} item
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {currentOrder.items.map((item) => {
                            const itemMeta = itemStatusMeta[item.status ?? 'pending']
                                ?? itemStatusMeta.pending;
                            const showItemStatus = !isCancelled && (
                                currentOrder.status === 'paid' ||
                                currentOrder.status === 'processing' ||
                                currentOrder.status === 'ready' ||
                                currentOrder.status === 'completed'
                            );

                            return (
                                <div
                                    key={item.id}
                                    className="rounded-2xl bg-[#F6F2E9]/60 p-3.5 ring-1 ring-[#CFC0A4]/30"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md bg-[#4F6B6A]/10 px-2 py-0.5 font-body text-xs font-semibold text-[#4F6B6A]">
                                                    {item.qty}x
                                                </span>
                                                <span className="font-body text-sm font-semibold text-[#2A2620]">
                                                    {item.menu.name}
                                                </span>
                                            </div>
                                            {item.options?.length > 0 && (
                                                <p className="font-body mt-1.5 text-xs text-[#8C8577]">
                                                    {item.options
                                                        .filter((o) => o.option_item)
                                                        .map((o) =>
                                                            o.quantity > 1
                                                                ? `${o.option_item.name} x${o.quantity}`
                                                                : o.option_item.name,
                                                        )
                                                        .join(', ')}
                                                </p>
                                            )}
                                            {item.notes && (
                                                <p className="font-body mt-1 text-xs italic text-[#8C8577]">
                                                    Catatan: {item.notes}
                                                </p>
                                            )}
                                        </div>
                                        {showItemStatus && (
                                            <span
                                                className={cn(
                                                    'shrink-0 rounded-full px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide',
                                                    itemMeta.tone === 'queued' &&
                                                        'bg-[#CFC0A4]/30 text-[#8C8577]',
                                                    itemMeta.tone === 'cooking' &&
                                                        'bg-[#D9A441]/20 text-[#AD7E2C]',
                                                    itemMeta.tone === 'ready' &&
                                                        'bg-[#4F6B6A]/15 text-[#4F6B6A]',
                                                )}
                                            >
                                                {itemMeta.label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#F6F2E9] pt-4">
                        <div className="flex items-center gap-2">
                            <span className="font-body text-xs font-semibold uppercase tracking-wide text-[#8C8577]">
                                Total
                            </span>
                        </div>
                        <span className="font-display text-xl font-semibold text-[#4F6B6A]">
                            {fmt(currentOrder.total)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-2xl px-4 pb-12 pt-6">
                {canCancel && (
                    <Button
                        className="mb-3 h-12 w-full rounded-2xl border-2 border-red-500/30 bg-white font-body text-sm font-semibold text-red-500 shadow-sm transition-all hover:bg-red-50 active:scale-[0.98] disabled:opacity-60"
                        onClick={handleCancel}
                        disabled={cancelling}
                    >
                        {cancelling ? 'Membatalkan...' : 'Batalkan Pesanan'}
                    </Button>
                )}
                <Button
                    className="h-12 w-full rounded-2xl bg-[#4F6B6A] font-body text-sm font-semibold text-white shadow-lg shadow-[#4F6B6A]/20 transition-all hover:bg-[#3d5554] active:scale-[0.98]"
                    onClick={() => router.visit(`/t/${tableToken}`)}
                >
                    Pesan Lagi
                </Button>
            </div>
        </div>
    );
}

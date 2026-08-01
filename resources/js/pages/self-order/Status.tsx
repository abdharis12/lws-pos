import { Head, router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import {
    Clock,
    ChefHat,
    CheckCircle2,
    CookingPot,
    UtensilsCrossed,
    Store,
    User,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OrderItem {
    id: number;
    menu: { name: string };
    qty: number;
    notes: string | null;
    options: { quantity: number; option_item: { name: string } }[];
}

interface Order {
    id: number;
    status: string;
    created_at: string;
    items: OrderItem[];
    total: number;
    customer_name: string | null;
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
    { key: 'pending', label: 'Pesanan Diterima', icon: CheckCircle2 },
    { key: 'paid', label: 'Pembayaran Dikonfirmasi', icon: CheckCircle2 },
    { key: 'processing', label: 'Sedang Dimasak', icon: CookingPot },
    { key: 'ready', label: 'Siap Disajikan', icon: UtensilsCrossed },
];

const stepIndex: Record<string, number> = {
    pending: 0,
    paid: 1,
    processing: 2,
    ready: 3,
    completed: 4,
};

export default function OrderStatus({ table, tableToken, order }: Props) {
    const [currentOrder, setCurrentOrder] = useState(order);
    const [elapsed, setElapsed] = useState('0m');

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
                subtotal: (e.order.subtotal as number) ?? prev.subtotal,
                tax: (e.order.tax as number) ?? prev.tax,
                total: (e.order.total as number) ?? prev.total,
            }));
        }
    });

    const current = stepIndex[currentOrder.status] ?? 0;
    const isCancelled = currentOrder.status === 'cancelled';

    return (
        <div className="min-h-screen bg-[#F6F2E9]">
            <Head title="Status Pesanan" />

            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(79, 107, 106, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(79, 107, 106, 0); }
                }
                @keyframes progress-glow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-pulse-dot { animation: pulse-dot 2s infinite; }
                .animate-progress-glow { animation: progress-glow 2s ease-in-out infinite; }
            `}</style>

            <div className="pt-safe bg-white px-6 pb-8 backdrop-blur-xl">
                <div className="mx-auto max-w-lg pt-8 text-center">
                    <div className="mb-5 flex justify-center">
                        {isCancelled ? (
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-500 shadow-lg shadow-red-400/30">
                                <XCircle className="h-12 w-12 text-white" />
                            </div>
                        ) : currentOrder.status === 'ready' ||
                          currentOrder.status === 'completed' ? (
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#4F6B6A] to-[#2C4645] shadow-lg shadow-[#4F6B6A]/30">
                                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#4F6B6A]/25" />
                                <CheckCircle2 className="h-12 w-12 text-white" />
                            </div>
                        ) : (
                            <div className="animate-pulse-dot flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#6E8C8A] to-[#4F6B6A] shadow-lg shadow-[#4F6B6A]/25">
                                <ChefHat className="h-12 w-12 text-white" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {isCancelled
                            ? 'Pesanan Dibatalkan'
                            : currentOrder.status === 'ready' ||
                                currentOrder.status === 'completed'
                              ? 'Pesanan Siap!'
                              : 'Pesanan Diproses'}
                    </h1>

                    <div className="mt-3 flex items-center justify-center gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4F6B6A]/10 px-3 py-1 font-medium text-[#4F6B6A]">
                            <Store className="h-3.5 w-3.5" />
                            Meja {table.code}
                        </span>
                        {currentOrder.customer_name && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4F6B6A]/10 px-3 py-1 font-medium text-[#4F6B6A]">
                                <User className="h-3.5 w-3.5" />
                                {currentOrder.customer_name}
                            </span>
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#F6F2E9] px-2 py-0.5 font-mono text-gray-500 ring-1 ring-[#CFC0A4]/40">
                            <Clock className="h-3.5 w-3.5" />
                            {elapsed}
                        </span>
                        <span className="rounded-md bg-[#F6F2E9] px-2 py-0.5 font-mono text-gray-500 ring-1 ring-[#CFC0A4]/40">
                            #{currentOrder.id}
                        </span>
                    </div>
                </div>
            </div>

            {!isCancelled && (
                <div className="mx-auto max-w-lg px-6 py-8">
                    <div className="space-y-0">
                        {steps.map((step, i) => {
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
                                                      ? 'animate-pulse-dot border-[#4F6B6A] bg-[#4F6B6A]/12 text-[#4F6B6A]'
                                                      : 'border-gray-200 bg-white text-gray-300',
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
                                                        ? 'bg-[#4F6B6A]/60'
                                                        : i === current
                                                          ? 'animate-progress-glow bg-gradient-to-b from-[#4F6B6A] to-gray-200'
                                                          : 'bg-gray-200',
                                                )}
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center pt-1.5 pb-10">
                                        <p
                                            className={cn(
                                                'text-sm font-semibold transition-colors',
                                                done || active
                                                    ? 'text-gray-900'
                                                    : 'text-gray-400',
                                            )}
                                        >
                                            {step.label}
                                        </p>
                                        {active &&
                                            currentOrder.status ===
                                                'processing' && (
                                                <p className="mt-0.5 text-xs font-medium text-[#4F6B6A]">
                                                    Chef sedang menyiapkan
                                                    pesanan Anda
                                                </p>
                                            )}
                                        {active &&
                                            currentOrder.status === 'ready' && (
                                                <p className="mt-0.5 text-xs font-medium text-[#4F6B6A]">
                                                    Pesanan siap diantar!
                                                </p>
                                            )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-lg px-6 pb-8">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#CFC0A4]/30">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">
                            Pesanan Anda
                        </h3>
                        <span className="rounded-full bg-[#4F6B6A]/10 px-2.5 py-0.5 text-xs font-semibold text-[#4F6B6A]">
                            {currentOrder.items.length} item
                        </span>
                    </div>
                    <div className="divide-y divide-[#F6F2E9]">
                        {currentOrder.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start justify-between py-2.5 first:pt-0 last:pb-0"
                            >
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-md bg-[#4F6B6A]/10 px-2 py-0.5 text-xs font-semibold text-[#4F6B6A]">
                                            {item.qty}x
                                        </span>
                                        <span className="text-sm text-gray-700">
                                            {item.menu.name}
                                        </span>
                                    </div>
                                    {item.options?.length > 0 && (
                                        <p className="mt-1 text-xs text-gray-500">
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
                                        <p className="mt-0.5 text-xs text-gray-400 italic">
                                            Catatan: {item.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#F6F2E9] pt-4">
                        <span className="text-sm font-semibold text-gray-800">
                            Total
                        </span>
                        <span className="text-lg font-bold text-[#4F6B6A]">
                            {fmt(currentOrder.total)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-lg px-6 pb-12">
                <Button
                    className="h-12 w-full rounded-2xl border-2 border-[#4F6B6A]/30 bg-[#4F6B6A] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4F6B6A]/80 active:scale-[0.98]"
                    onClick={() => router.visit(`/t/${tableToken}`)}
                >
                    Pesan Lagi
                </Button>
            </div>
        </div>
    );
}

import { Head, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Award, BellRing, Check, Crown, HandPlatter, MapPin, Timer, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { playBeep, optionDisplayName } from '@/pages/kitchen/lib/utils';
import { BORDER, CREAM, INK, MUTED, PRIMARY, SAND } from '@/pages/pos/constants';

interface ReadyOrderItemOption {
    id?: number;
    name: string;
    quantity: number;
    option_item?: { name: string };
    optionItem?: { name: string };
}

interface ReadyOrderItem {
    id: number;
    qty: number;
    notes: string | null;
    menu: { name: string; station: string | null };
    options: ReadyOrderItemOption[];
}

interface ReadyOrder {
    id: number;
    order_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    customer_name: string | null;
    items: ReadyOrderItem[];
    table_session: { table: { code: string; floor: string | null } } | null;
}

interface LeaderboardEntry {
    waiter: string;
    points: number;
}

interface Props {
    readyOrders: ReadyOrder[];
    leaderboard: LeaderboardEntry[];
}

function calcReadyMinutes(updatedAt: string, now: number): string {
    const diff = now - new Date(updatedAt).getTime();
    const mins = Math.max(0, Math.floor(diff / 60000));

    if (mins < 1) {
        return 'baru saja';
    }

    if (mins < 60) {
        return `${mins} menit`;
    }

    const h = Math.floor(mins / 60);

    return `${h} jam`;
}

export default function WaiterReadyOrders({ readyOrders, leaderboard }: Props) {
    const { auth } = usePage<{ auth: { user?: { id: number; name: string } | null; outlet_id?: number | null } }>().props;
    const outletId = auth.outlet_id;
    const waiterName = auth.user?.name ?? 'Waiter';
    const [serving, setServing] = useState<ReadyOrder | null>(null);
    const [processing, setProcessing] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const [checkedItems, setCheckedItems] = useState<Record<number, Set<number>>>({});

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30000);

        return () => clearInterval(id);
    }, []);

    function toggleItem(orderId: number, itemId: number) {
        setCheckedItems(prev => {
            const next = new Set(prev[orderId] ?? []);

            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }

            return { ...prev, [orderId]: next };
        });
    }

    function checkedCount(order: ReadyOrder): number {
        return order.items.filter(item => checkedItems[order.id]?.has(item.id)).length;
    }

    useEcho<{ order: { id: number; status: string } }>(
        outletId ? `outlet.${outletId}.pos` : '',
        '.OrderStatusUpdated',
        (e) => {
            if (e.order.status === 'ready') {
                playBeep();
                router.reload({ only: ['readyOrders', 'leaderboard'] });
            }
        },
        [outletId],
    );

    function confirmServe() {
        if (!serving) {
            return;
        }

        setProcessing(true);
        router.patch(`/orders/${serving.id}/serve`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setServing(null);
            },
        });
    }

    return (
        <div className="min-h-screen font-sans text-slate-800" style={{ backgroundColor: CREAM }}>
            <Head title="Siap Saji" />

            <style>{`
                @keyframes ready-flash {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                    50% { box-shadow: 0 0 34px 6px rgba(16, 185, 129, 0.18); }
                }
                .ready-flash { animation: ready-flash 2.4s ease-in-out infinite; }
            `}</style>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-6 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center" style={{ borderColor: BORDER }}>
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl" style={{ backgroundColor: PRIMARY, color: SAND }}>
                            <HandPlatter className="size-6" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl font-bold tracking-tight" style={{ color: INK }}>
                                Siap Saji
                            </h1>
                            <p className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                                <User className="size-3.5" />
                                Pengantar: <strong style={{ color: INK }}>{waiterName}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: BORDER, backgroundColor: '#fff' }}>
                        <BellRing className="size-4" style={{ color: PRIMARY }} />
                        <span style={{ color: INK }}>{readyOrders.length}</span> pesanan menunggu diantar
                    </div>
                </header>

                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                    <section className="mb-6 rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: BORDER }}>
                        <div className="mb-3 flex items-center gap-2">
                            <Crown className="size-4 text-amber-500" />
                            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: INK }}>
                                Papan Poin Antar Hari Ini
                            </h2>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {leaderboard.map((entry, index) => {
                                const isMe = entry.waiter === waiterName;
                                const isTop = index === 0;

                                return (
                                    <div
                                        key={entry.waiter}
                                        className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isMe ? 'ring-1' : ''}`}
                                        style={{
                                            borderColor: isMe ? PRIMARY : BORDER,
                                            backgroundColor: isMe ? `${PRIMARY}08` : CREAM,
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className="flex size-7 items-center justify-center rounded-full text-xs font-bold"
                                                style={{
                                                    backgroundColor: isTop ? '#f59e0b' : `${PRIMARY}15`,
                                                    color: isTop ? '#fff' : PRIMARY,
                                                }}
                                            >
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: INK }}>
                                                    {entry.waiter} {isMe && <span className="text-[10px] font-normal" style={{ color: MUTED }}>(Anda)</span>}
                                                </p>
                                                <p className="text-[11px]" style={{ color: MUTED }}>
                                                    {entry.points} poin
                                                </p>
                                            </div>
                                        </div>
                                        {isTop && <Award className="size-4 text-amber-500" />}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Ready Orders */}
                {readyOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-5 flex size-20 items-center justify-center rounded-3xl" style={{ backgroundColor: `${PRIMARY}12` }}>
                            <HandPlatter className="size-10" style={{ color: PRIMARY }} />
                        </div>
                        <h2 className="font-serif text-xl font-bold" style={{ color: INK }}>
                            Tidak Ada Pesanan Siap
                        </h2>
                        <p className="mt-1 max-w-sm text-sm" style={{ color: MUTED }}>
                            Pesanan yang sudah selesai dimasak akan muncul di sini beserta nomor mejanya.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {readyOrders.map(order => {
                            const tableCode = order.table_session?.table?.code ?? order.order_type;
                            const floor = order.table_session?.table?.floor;
                            const totalQty = order.items.reduce((sum, i) => sum + i.qty, 0);
                            const checked = checkedCount(order);
                            const allChecked = order.items.length > 0 && checked === order.items.length;
                            const progress = order.items.length > 0 ? Math.round((checked / order.items.length) * 100) : 0;

                            return (
                                <div
                                    key={order.id}
                                    className="ready-flash flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-transform hover:-translate-y-0.5"
                                    style={{ borderColor: 'rgba(16,185,129,0.35)' }}
                                >
                                    <div className="flex items-center justify-between gap-2 p-4" style={{ backgroundColor: '#ecfdf5' }}>
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-15 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
                                                {tableCode}
                                            </span>
                                            <div>
                                                <p className="flex items-center gap-1 text-[11px] font-medium" style={{ color: MUTED }}>
                                                    <MapPin className="size-3" />
                                                    {floor ?? 'Dine In'} • Order #{order.id}
                                                </p>
                                                <p className="text-sm font-semibold" style={{ color: INK }}>
                                                    {order.customer_name || 'Tanpa nama'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                            <Timer className="size-3" />
                                            {calcReadyMinutes(order.updated_at, now)}
                                        </span>
                                    </div>

                                    <div className="flex-1 space-y-1 p-4">
                                        {order.items.map(item => {
                                            const isChecked = checkedItems[order.id]?.has(item.id) ?? false;
                                            const hasOptions = (item.options ?? []).length > 0;

                                            return (
                                                <div key={item.id} className="min-w-0">
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => toggleItem(order.id, item.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                toggleItem(order.id, item.id);
                                                            }
                                                        }}
                                                        className={cn(
                                                            'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all',
                                                            isChecked ? 'opacity-50' : 'hover:bg-emerald-50',
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                'flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                                                                isChecked
                                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                    : 'border-slate-300 text-transparent',
                                                            )}
                                                        >
                                                            <Check className="size-3.5" />
                                                        </span>
                                                        <span
                                                            className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-bold tabular-nums"
                                                            style={{ color: PRIMARY }}
                                                        >
                                                            {item.qty}x
                                                        </span>
                                                        <span
                                                            className={cn('min-w-0 truncate', isChecked && 'line-through')}
                                                            style={{ color: INK }}
                                                        >
                                                            {item.menu.name}
                                                        </span>
                                                        {item.notes && (
                                                            <span className="shrink-0 text-[10px] italic text-amber-500">📝</span>
                                                        )}
                                                    </div>
                                                    {hasOptions && (
                                                        <ul
                                                            className="ml-8 mt-0.5 mb-1 space-y-0.5 text-[11px]"
                                                            style={{ color: MUTED }}
                                                        >
                                                            {(item.options ?? []).map((opt, oi) => (
                                                                <li key={oi} className="truncate">
                                                                    + {optionDisplayName(opt)}
                                                                    {opt.quantity > 1 ? ` x${opt.quantity}` : ''}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="px-4 pb-3">
                                        <div className="flex items-center justify-between text-[11px] font-medium" style={{ color: MUTED }}>
                                            <span>{checked} dari {order.items.length} item diantar</span>
                                            {allChecked && (
                                                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                                    <Check className="size-3" />
                                                    Semua diantar
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={cn('h-full rounded-full transition-all', progress === 100 ? 'bg-emerald-500' : 'bg-emerald-400')}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t p-4" style={{ borderColor: BORDER }}>
                                        <Button
                                            onClick={() => setServing(order)}
                                            className="w-full gap-2 font-semibold"
                                            style={{ backgroundColor: '#059669' }}
                                        >
                                            <Check className="size-4" />
                                            Selesai Antar • {totalQty} item
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirm Serve Dialog */}
            <Dialog open={!!serving} onOpenChange={(open) => !open && setServing(null)}>
                <DialogContent className="sm:max-w-md" style={{ backgroundColor: CREAM }}>
                    {serving && (
                        <>
                            <DialogHeader>
                                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100">
                                    <HandPlatter className="size-7 text-emerald-600" />
                                </div>
                                <DialogTitle className="mt-3 text-center font-serif text-xl font-bold" style={{ color: INK }}>
                                    Konfirmasi Antar Pesanan
                                </DialogTitle>
                                <DialogDescription className="text-center">
                                    Pesanan meja{' '}
                                    <span className="font-bold" style={{ color: INK }}>
                                        {serving.table_session?.table?.code ?? serving.order_type}
                                    </span>{' '}
                                    akan ditandai selesai diantar.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="rounded-xl border bg-white p-4 text-center" style={{ borderColor: BORDER }}>
                                <p className="text-xs" style={{ color: MUTED }}>Diantar oleh (otomatis dari akun Anda)</p>
                                <p className="mt-1 font-semibold" style={{ color: INK }}>{waiterName}</p>
                                <p className="mt-1 text-[11px] italic" style={{ color: MUTED }}>
                                    +1 poin untuk papan poin antar hari ini
                                </p>
                            </div>

                            <DialogFooter className="gap-2 sm:justify-center">
                                <Button
                                    variant="ghost"
                                    onClick={() => setServing(null)}
                                    disabled={processing}
                                    className="border text-slate-600 hover:bg-slate-100"
                                    style={{ borderColor: BORDER }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={confirmServe}
                                    disabled={processing}
                                    className="font-semibold text-white"
                                    style={{ backgroundColor: '#059669' }}
                                >
                                    {processing ? 'Memproses...' : 'Ya, Selesai Antar'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

WaiterReadyOrders.layout = null;

import { router } from '@inertiajs/react';
import { Check, CookingPot, MapPin, Play, Printer } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { optionDisplayName, stationIcon } from '../lib/utils';
import type { KitchenOrder } from '../types';

interface Props {
    order: KitchenOrder;
    isNew?: boolean;
    stationName?: string;
    onPrint?: () => void;
}

export default function OrderCard({
    order,
    isNew,
    stationName,
    onPrint,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

    const itemStatuses = order.items.map(i => i.status ?? 'pending');
    const allPending = order.items.length > 0 && itemStatuses.every(s => s === 'pending');
    const allReady = order.items.length > 0 && itemStatuses.every(s => s === 'ready');
    const inProgress = !allPending && !allReady;

    const statusCfg = allReady
        ? { label: 'Siap', color: '#22c55e', dotColor: '#22c55e' }
        : inProgress
            ? { label: 'Dimasak', color: '#3b82f6', dotColor: '#3b82f6' }
            : { label: 'Menunggu', color: '#eab308', dotColor: '#eab308' };

    function handleAction(status: 'processing' | 'ready') {
        if (order.items.length === 0) {
            return;
        }

        setLoading(true);
        router.patch(
            `/orders/${order.id}/items/status`,
            {
                item_ids: order.items.map(i => i.id),
                status,
            },
            {
                preserveState: true,
                onSuccess: () => {
                    router.reload({ only: ['stations', 'unassignedOrders', 'readyOrders'] });
                },
                onFinish: () => setLoading(false),
            },
        );
    }

    function toggleItem(itemId: number) {
        setCheckedItems((prev) => {
            const next = new Set(prev);

            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }

            return next;
        });
    }

    const allChecked =
        order.items.length > 0 &&
        order.items.every((i) => checkedItems.has(i.id));
    const hasNotes = order.items.some((i) => i.notes);
    const floor = order.table_session?.table?.floor;
    const tableCode = order.table_session?.table?.code;
    const showStation = stationName && stationName.trim() !== '';

    return (
        <div
            className={cn(
                'group relative min-w-0 rounded-xl border transition-all duration-500',
                isNew ? 'border-emerald-500/40' : 'border-transparent',
            )}
            style={{
                backgroundColor: 'rgba(35,52,51,0.6)',
                backdropFilter: 'blur(8px)',
                boxShadow: isNew
                    ? '0 0 30px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
        >
            <div
                className="absolute right-0 bottom-0 left-0 h-32 rounded-b-xl opacity-[0.03]"
                style={{
                    background: `linear-gradient(to top, ${statusCfg.color}, transparent)`,
                }}
            />

            <div className="relative z-10 min-w-0 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <span
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                                backgroundColor: 'rgba(79,107,106,0.2)',
                                color: '#CFC0A4',
                            }}
                        >
                            #{order.id}
                        </span>
                        <span className="text-sm font-semibold text-white">
                            {tableCode ?? order.order_type}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span
                                className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                                style={{
                                    backgroundColor: `${statusCfg.color}18`,
                                    color: statusCfg.color,
                                }}
                            >
                                <span
                                    className="size-1.5 rounded-full"
                                    style={{ backgroundColor: statusCfg.dotColor }}
                                />
                                {statusCfg.label}
                            </span>
                        </div>
                        {onPrint && (
                            <button
                                onClick={onPrint}
                                title="Print label dapur"
                                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                            >
                                <Printer className="size-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {(floor || order.customer_name || showStation) && (
                    <div className="flex flex-wrap items-center gap-1.5 pb-3 pl-8">
                        {floor && (
                            <span
                                className="flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    color: 'rgba(255,255,255,0.5)',
                                }}
                            >
                                <MapPin className="size-2.5" />
                                {floor}
                            </span>
                        )}
                        {order.customer_name && (
                            <span className="truncate text-[11px] text-white/50">
                                {order.customer_name}
                            </span>
                        )}
                        {showStation && (
                            <span
                                className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                                style={{
                                    backgroundColor: 'rgba(79,107,106,0.2)',
                                    color: '#CFC0A4',
                                }}
                            >
                                {stationIcon(stationName)}
                                {stationName}
                            </span>
                        )}
                    </div>
                )}

                <div className="min-w-0 space-y-1">
                    {order.items.map((item) => {
                        const checked = checkedItems.has(item.id);
                        const hasOptions = (item.options ?? []).length > 0;

                        return (
                            <div key={item.id} className="min-w-0">
                                <div
                                    className={cn(
                                        'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all',
                                        checked ? 'opacity-50' : 'hover:bg-white/5',
                                    )}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <span
                                        className={cn(
                                            'flex size-4 shrink-0 items-center justify-center rounded border transition-all',
                                            checked
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : 'border-white/20 text-transparent',
                                        )}
                                    >
                                        {checked && <Check className="size-3" />}
                                    </span>
                                    <span
                                        className={cn(
                                            'flex shrink-0 items-center justify-center rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-bold tabular-nums',
                                        )}
                                        style={{ color: '#CFC0A4' }}
                                    >
                                        {item.qty}x
                                    </span>
                                    <span
                                        className={cn(
                                            'min-w-0 truncate text-white',
                                            checked && 'line-through',
                                        )}
                                    >
                                        {item.menu.name}
                                    </span>
                                    {item.notes && (
                                        <span className="shrink-0 text-[10px] text-amber-400/80 italic">
                                            📝
                                        </span>
                                    )}
                                </div>
                                {hasOptions && (
                                    <ul className="mt-0.5 mb-1 ml-9 space-y-0.5 text-[11px]">
                                        {item.options.map((opt, oi) => (
                                            <li
                                                key={oi}
                                                className="truncate text-[#CFC0A4]/80"
                                            >
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

                {hasNotes && (
                    <div
                        className="mt-2 mb-3 space-y-1 overflow-hidden rounded-lg p-2 text-xs"
                        style={{
                            backgroundColor: 'rgba(251,191,36,0.08)',
                            border: '1px solid rgba(251,191,36,0.15)',
                        }}
                    >
                        {order.items
                            .filter((i) => i.notes)
                            .map((i) => (
                                <p
                                    key={i.id}
                                    className="truncate text-amber-300/80"
                                >
                                    <strong className="text-amber-200">
                                        {i.menu.name}:
                                    </strong>{' '}
                                    {i.notes}
                                </p>
                            ))}
                    </div>
                )}

                <div
                    className="mt-3 flex items-center justify-between gap-2 border-t pt-3"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-white/40">
                            {order.items.length} item
                        </span>
                        {allChecked && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                Semua selesai
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {allPending && (
                            <button
                                onClick={() => handleAction('processing')}
                                disabled={loading}
                                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                                style={{ backgroundColor: '#4F6B6A' }}
                            >
                                {loading ? (
                                    <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    <Play className="size-3.5" />
                                )}
                                Mulai Masak
                            </button>
                        )}
                        {inProgress && (
                            <button
                                onClick={() => handleAction('ready')}
                                disabled={loading}
                                className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                                style={{ backgroundColor: '#22c55e' }}
                            >
                                {loading ? (
                                    <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    <CookingPot className="size-3.5" />
                                )}
                                Selesai
                            </button>
                        )}
                        {allReady && (
                            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
                                <Check className="size-3.5" />
                                Siap
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

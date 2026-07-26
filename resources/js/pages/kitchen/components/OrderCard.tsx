import { router } from '@inertiajs/react';
import { Check, CookingPot, MapPin, Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getStatusConfig, stationIcon } from '../lib/utils';
import type { KitchenOrder } from '../types';

interface Props {
    order: KitchenOrder;
    stationName?: string;
}

export default function OrderCard({ order, isNew, stationName }: Props) {
    const [loading, setLoading] = useState(false);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const statusCfg = getStatusConfig(order.status);

    function handleAction(status: 'processing' | 'ready') {
        setLoading(true);
        router.patch(`/orders/${order.id}/status`, { status }, {
            preserveState: true,
            onFinish: () => setLoading(false),
        });
    }

    function toggleItem(itemId: number) {
        setCheckedItems(prev => {
            const next = new Set(prev);

            if (next.has(itemId)) {
next.delete(itemId);
} else {
next.add(itemId);
}

            return next;
        });
    }

    const allChecked = order.items.length > 0 && order.items.every(i => checkedItems.has(i.id));
    const hasNotes = order.items.some(i => i.notes);
    const floor = order.table_session?.table?.floor;
    const tableCode = order.table_session?.table?.code;
    const showStation = stationName && stationName !== 'Lainnya';

    return (
        <div
            className={cn(
                'group relative min-w-0 rounded-xl border transition-all duration-500',
                isNew ? 'border-emerald-500/40' : 'border-transparent',
            )}
            style={{
                backgroundColor: 'rgba(30,41,59,0.6)',
                backdropFilter: 'blur(8px)',
                boxShadow: isNew
                    ? '0 0 30px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
        >

            <div className="absolute bottom-0 left-0 right-0 h-32 rounded-b-xl opacity-[0.03]"
                style={{
                    background: `linear-gradient(to top, ${statusCfg.color}, transparent)`,
                }}
            />

            <div className="relative z-10 min-w-0 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                        <span className="flex shrink-0 size-7 items-center justify-center rounded-lg text-xs font-bold"
                            style={{ backgroundColor: 'rgba(79,107,106,0.2)', color: '#CFC0A4' }}
                        >
                            #{order.id}
                        </span>
                        <span className="text-sm font-semibold text-white">
                            {tableCode ?? order.order_type}
                        </span>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{ backgroundColor: `${statusCfg.color}18`, color: statusCfg.color }}
                    >
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: statusCfg.dotColor }} />
                        {statusCfg.label}
                    </span>
                </div>
                {(floor || order.customer_name || showStation) && (
                    <div className="flex flex-wrap items-center gap-1.5 pl-8 pb-3">
                        {floor && (
                            <span className="flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                            >
                                <MapPin className="size-2.5" />
                                {floor}
                            </span>
                        )}
                        {order.customer_name && (
                            <span className="truncate text-[11px] text-white/50">{order.customer_name}</span>
                        )}
                        {showStation && (
                            <span className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                                style={{ backgroundColor: 'rgba(79,107,106,0.2)', color: '#CFC0A4' }}
                            >
                                {stationIcon(stationName)}
                                {stationName}
                            </span>
                        )}
                    </div>
                )}

                <div className="min-w-0 space-y-1">
                    {order.items.map(item => {
                        const checked = checkedItems.has(item.id);

                        return (
                            <div
                                key={item.id}
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
                                <span className={cn('min-w-0 truncate text-white', checked && 'line-through')}>{item.menu.name}</span>
                                {item.notes && (
                                    <span className="shrink-0 text-[10px] italic text-amber-400/80">📝</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {hasNotes && (
                    <div className="mb-3 mt-2 overflow-hidden space-y-1 rounded-lg p-2 text-xs"
                        style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
                    >
                        {order.items.filter(i => i.notes).map(i => (
                            <p key={i.id} className="truncate text-amber-300/80">
                                <strong className="text-amber-200">{i.menu.name}:</strong> {i.notes}
                            </p>
                        ))}
                    </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-white/40">{order.items.length} item</span>
                        {allChecked && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                Semua selesai
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {order.status === 'paid' && (
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
                        {order.status === 'processing' && (
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
                    </div>
                </div>
            </div>
        </div>
    );
}

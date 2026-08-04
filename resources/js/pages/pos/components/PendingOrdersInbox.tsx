import { ChevronDown, ChevronUp, Inbox, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';
import type { PendingOrder } from '../types';

interface Props {
    orders: PendingOrder[];
    selectedId: number | null;
    onSelect: (order: PendingOrder) => void;
    onDelete: (order: PendingOrder) => void;
}

export default function PendingOrdersInbox({
    orders,
    selectedId,
    onSelect,
    onDelete,
}: Props) {
    const [expanded, setExpanded] = useState(() => orders.length > 0);
    const hasOrders = orders.length > 0;

    return (
        <div style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: CREAM }}>
            <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className="flex w-full items-center justify-between px-5 py-2 text-left transition-colors hover:opacity-80"
                aria-expanded={expanded}
            >
                <div className="flex items-center gap-2">
                    <Inbox className="size-4" style={{ color: MUTED }} />
                    <span className="text-sm font-semibold" style={{ color: INK }}>
                        Pesanan Baru
                    </span>
                    {hasOrders && (
                        <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY }}
                        >
                            {orders.length}
                        </span>
                    )}
                </div>
                {expanded ? (
                    <ChevronUp className="size-4" style={{ color: MUTED }} />
                ) : (
                    <ChevronDown className="size-4" style={{ color: MUTED }} />
                )}
            </button>

            {expanded && hasOrders && (
                <div
                    className="flex gap-2 overflow-x-auto px-5 pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => onSelect(order)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    onSelect(order);
                                }
                            }}
                            className="group relative flex-shrink-0 cursor-pointer rounded-xl p-3 text-left transition-all snap-start"
                            style={{
                                border: `1px solid ${selectedId === order.id ? PRIMARY : BORDER}`,
                                backgroundColor: selectedId === order.id ? `${PRIMARY}08` : '#fff',
                                minWidth: '160px',
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold" style={{ color: INK }}>
                                    {order.table_session?.table?.code ?? '—'}
                                </span>
                                <span className="text-xs whitespace-nowrap" style={{ color: MUTED }}>
                                    Rp {Number(order.total).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <p className="mt-1 text-xs" style={{ color: MUTED }}>
                                {order.customer_name || 'Tanpa nama'}
                            </p>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(order);
                                }}
                                className="absolute top-1 right-1 hidden rounded p-0.5 text-red-400 transition-colors group-hover:block hover:bg-red-50 hover:text-red-600"
                                title="Hapus pesanan"
                            >
                                <Trash2 className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
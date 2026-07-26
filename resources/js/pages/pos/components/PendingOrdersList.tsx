import { cn } from '@/lib/utils';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';
import type { PendingOrder } from '../types';

interface Props {
    orders: PendingOrder[];
    selectedId: number | null;
    onSelect: (order: PendingOrder) => void;
    variant?: 'sidebar' | 'mobile';
}

export default function PendingOrdersList({ orders, selectedId, onSelect, variant = 'sidebar' }: Props) {
    if (orders.length === 0) {
return null;
}

    if (variant === 'mobile') {
        return (
            <div className="overflow-x-auto p-3 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: CREAM }}>
                <h2 className="mb-2 text-sm font-semibold" style={{ color: INK }}>Pesanan Baru</h2>
                <div className="flex gap-2">
                    {orders.map(order => (
                        <button
                            key={order.id}
                            onClick={() => onSelect(order)}
                            className="flex-shrink-0 rounded-xl p-3 text-left transition-all"
                            style={{
                                border: `1px solid ${selectedId === order.id ? PRIMARY : BORDER}`,
                                backgroundColor: selectedId === order.id ? `${PRIMARY}08` : '#fff',
                                minWidth: '140px',
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold" style={{ color: INK }}>
                                    {order.table_session?.table?.code ?? '—'}
                                </span>
                                <span className="whitespace-nowrap text-xs" style={{ color: MUTED }}>
                                    Rp {Number(order.total).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                                {order.customer_name || 'Tanpa nama'}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
            <h2 className="text-base font-semibold" style={{ color: INK }}>Pesanan Baru</h2>
            <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Menunggu konfirmasi</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
                {orders.map(order => (
                    <button
                        key={order.id}
                        onClick={() => onSelect(order)}
                        className={cn(
                            'w-full rounded-xl p-3 text-left transition-all',
                            selectedId === order.id ? 'ring-1' : 'hover:opacity-80'
                        )}
                        style={{
                            border: `1px solid ${selectedId === order.id ? PRIMARY : BORDER}`,
                            backgroundColor: selectedId === order.id ? `${PRIMARY}08` : CREAM,
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold" style={{ color: INK }}>
                                {order.table_session?.table?.code ?? '—'}
                            </span>
                            <span className="text-xs" style={{ color: MUTED }}>
                                Rp {Number(order.total).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                            {order.customer_name || 'Tanpa nama'}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}

import { ChevronDown, ChevronUp, Inbox, RefreshCw, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';
import type { PendingOrder } from '../types';

interface Props {
    orders: PendingOrder[];
    selectedId: number | null;
    onSelect: (order: PendingOrder) => void;
    onDelete: (order: PendingOrder) => void;
    onCheckStatus: (order: PendingOrder) => void;
    onCancelPayment: (order: PendingOrder) => void;
}

const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    debit: 'Kartu Debit',
    credit: 'Kartu Kredit',
    gopay: 'GoPay',
    shopeepay: 'ShopeePay',
    bca_va: 'BCA VA',
    mandiri_va: 'Mandiri VA',
    bni_va: 'BNI VA',
    bri_va: 'BRI VA',
    permata_va: 'Permata VA',
    echannel: 'Mandiri Bill',
    indomaret: 'Indomaret',
    alfamart: 'Alfamart',
    akulaku: 'Akulaku',
};

function paymentLabel(method: string | null | undefined): string {
    if (!method) {
        return 'Online';
    }

    return PAYMENT_LABELS[method] ?? method;
}

export default function PendingOrdersInbox({
    orders,
    selectedId,
    onSelect,
    onDelete,
    onCheckStatus,
    onCancelPayment,
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
                    {orders.map((order) => {
                        const isOnline = order.status === 'pending_payment';

                        return (
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
                                    minWidth: '200px',
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

                                {isOnline && (
                                    <span
                                        className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                        style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#b45309' }}
                                    >
                                        Menunggu Bayar · {paymentLabel(order.payment?.method)}
                                    </span>
                                )}

                                {isOnline ? (
                                    <div className="mt-2 flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCheckStatus(order);
                                            }}
                                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-white transition-all hover:opacity-90"
                                            style={{ backgroundColor: PRIMARY }}
                                        >
                                            <RefreshCw className="size-3" />
                                            Cek Status
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCancelPayment(order);
                                            }}
                                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-white transition-all hover:opacity-90"
                                            style={{ backgroundColor: '#e11d48' }}
                                        >
                                            <XCircle className="size-3" />
                                            Batal
                                        </button>
                                    </div>
                                ) : (
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
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
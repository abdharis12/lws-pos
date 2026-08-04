import { History, Printer, Receipt, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';
import { orderTypeLabel } from '../lib/format';
import type { OrderData } from '../types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPrint: (order: OrderData) => void;
    loading: boolean;
    error: string | null;
    orders: OrderData[];
}

function formatTimeShort(iso: string): string {
    return new Date(iso).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatRupiah(n: number): string {
    return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
}

function paymentBadge(method: string | null): { label: string; bg: string; fg: string } {
    switch (method) {
        case 'cash':
            return { label: 'Tunai', bg: `${PRIMARY}15`, fg: PRIMARY };
        case 'qris':
            return { label: 'QRIS', bg: '#dbeafe', fg: '#1d4ed8' };
        default:
            return { label: method?.toUpperCase() ?? '—', bg: CREAM, fg: INK };
    }
}

export default function HistoryDialog({ open, onOpenChange, onPrint, loading, error, orders }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const visibleOrders = open ? orders : [];
    const totalRevenue = visibleOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const selected = visibleOrders.find(o => o.id === selectedId) ?? null;

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) {
                    setSelectedId(null);
                }

                onOpenChange(v);
            }}
        >
            <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl" style={{ backgroundColor: CREAM }}>
                <DialogTitle className="sr-only">Histori Pesanan Hari Ini</DialogTitle>

                <div className="flex items-center justify-between border-b px-5 py-4 mt-12" style={{ borderColor: BORDER, backgroundColor: '#fff' }}>
                    <div className="flex items-center gap-2">
                        <History className="size-5" style={{ color: PRIMARY }} />
                        <div>
                            <h2 className="text-base font-bold" style={{ color: INK }}>Histori Pesanan</h2>
                            <p className="text-xs" style={{ color: MUTED }}>Hari ini · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!loading && visibleOrders.length > 0 && (
                            <div className="text-right">
                                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: MUTED }}>Total</p>
                                <p className="text-sm font-bold" style={{ color: PRIMARY }}>{formatRupiah(totalRevenue)}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto" style={{ backgroundColor: CREAM }}>
                    {loading && (
                        <div className="flex flex-col items-center justify-center gap-3 py-16">
                            <div className="size-10 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${PRIMARY}30`, borderTopColor: PRIMARY }} />
                            <p className="text-sm" style={{ color: MUTED }}>Memuat histori...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: '#fef2f2' }}>
                                <X className="size-5 text-rose-500" />
                            </div>
                            <p className="text-sm font-medium" style={{ color: INK }}>{error}</p>
                        </div>
                    )}

                    {!loading && !error && visibleOrders.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full" style={{ backgroundColor: `${PRIMARY}10` }}>
                                <Receipt className="size-7" style={{ color: PRIMARY }} />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: INK }}>Belum ada pesanan selesai</p>
                                <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Pesanan yang sudah dibayar akan muncul di sini</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && visibleOrders.length > 0 && (
                        <ul className="divide-y" style={{ borderColor: BORDER }}>
                            {visibleOrders.map(order => {
                                const badge = paymentBadge(order.payment?.method ?? null);
                                const orderType = orderTypeLabel(order.order_type);
                                const tableCode = order.table_session?.table?.code;
                                const isSelected = selected?.id === order.id;
                                const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

                                return (
                                    <li key={order.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(isSelected ? null : order.id)}
                                            className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:opacity-90"
                                            style={{ backgroundColor: isSelected ? `${PRIMARY}08` : '#fff' }}
                                        >
                                            <div className="flex size-10 flex-shrink-0 flex-col items-center justify-center rounded-xl" style={{ backgroundColor: `${PRIMARY}12` }}>
                                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: PRIMARY }}>
                                                    TRX
                                                </span>
                                                <span className="text-sm font-bold leading-none" style={{ color: PRIMARY }}>
                                                    #{order.id}
                                                </span>
                                            </div>

                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-sm font-semibold" style={{ color: INK }}>
                                                        {tableCode ? `Meja ${tableCode}` : orderType}
                                                        {order.customer_name && ` · ${order.customer_name}`}
                                                    </span>
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                                                    <span>{formatTimeShort(order.created_at)}</span>
                                                    <span>·</span>
                                                    <span>{itemCount} item</span>
                                                    <span>·</span>
                                                    <span
                                                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                                        style={{ backgroundColor: badge.bg, color: badge.fg }}
                                                    >
                                                        {badge.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                                <span className="text-sm font-bold" style={{ color: INK }}>
                                                    {formatRupiah(Number(order.total))}
                                                </span>
                                                <ChevronRight className="size-4 transition-transform" style={{ color: MUTED, transform: isSelected ? 'rotate(90deg)' : undefined }} />
                                            </div>
                                        </button>

                                        {isSelected && (
                                            <div className="border-t px-5 py-3" style={{ borderColor: BORDER, backgroundColor: CREAM }}>
                                                <div className="mb-2 space-y-1.5">
                                                    {order.items.map(item => (
                                                        <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                                                            <div className="flex-1">
                                                                <p style={{ color: INK }}>
                                                                    <span className="font-semibold">{item.qty}x</span> {item.menu.name}
                                                                </p>
                                                                {item.options.length > 0 && (
                                                                    <p className="ml-4" style={{ color: MUTED }}>
                                                                        {item.options.map(o => o.option_item.name).join(', ')}
                                                                    </p>
                                                                )}
                                                                {item.notes && (
                                                                    <p className="ml-4 italic" style={{ color: MUTED }}>
                                                                        Catatan: {item.notes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <span className="whitespace-nowrap font-medium" style={{ color: INK }}>
                                                                {formatRupiah(Number(item.total_price))}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: BORDER }}>
                                                    <span className="text-xs font-semibold" style={{ color: MUTED }}>Total</span>
                                                    <span className="text-base font-bold" style={{ color: PRIMARY }}>
                                                        {formatRupiah(Number(order.total))}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onPrint(order)}
                                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                                                    style={{ backgroundColor: PRIMARY }}
                                                >
                                                    <Printer className="size-4" /> Cetak Ulang Struk
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { useState, useMemo } from 'react';
import {
    ShoppingCart, Plus, Minus, X, Percent, SplitSquareVertical,
    Printer, Wallet, QrCode, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BORDER, CREAM, INK, MUTED, PRIMARY, SAND } from '../constants';
import type { CartItem } from '../types';

interface Props {
    items: CartItem[];
    processing: boolean;
    onUpdateQty: (index: number, qty: number) => void;
    onRemove: (index: number) => void;
    onOrder: (method?: string) => void;
    onConfirmPay?: () => void;
    pendingOrderId?: number | null;
    confirmPayProcessing?: boolean;
    tableSelected?: boolean;
    discountType: string | null;
    discountValue: number;
    discountApprovedBy: number | null;
    onDiscountChange: (type: string | null, value: number) => void;
    onOpenApproval: () => void;
    splitCount: number;
    onOpenSplitBill: () => void;
    onPrintReceipt: () => void;
    showPrintButton: boolean;
}

export default function CartPanel({
    items, processing, onUpdateQty, onRemove, onOrder, onConfirmPay,
    pendingOrderId, confirmPayProcessing, tableSelected = true,
    discountType, discountValue, discountApprovedBy,
    onDiscountChange, onOpenApproval, splitCount, onOpenSplitBill,
    onPrintReceipt, showPrintButton,
}: Props) {
    const [showDiscount, setShowDiscount] = useState(false);
    const subtotal = useMemo(() => items.reduce((sum, item) => {
        const optAdj = item.selectedOptions.reduce((s, o) => s + o.adjustment, 0);
        return sum + (Number(item.menu.price) + optAdj) * item.qty;
    }, 0), [items]);

    const discountAmount = useMemo(() => {
        if (!discountType || !discountValue) return 0;
        if (discountType === 'percentage') return Math.min(subtotal * (discountValue / 100), subtotal);
        return Math.min(discountValue, subtotal);
    }, [subtotal, discountType, discountValue]);

    const total = subtotal - discountAmount;
    const isConfirmMode = !!pendingOrderId;
    const needsApproval = discountType === 'percentage' ? discountValue > 10 : discountValue > 50000;

    return (
        <div className="flex h-full flex-col bg-white">
            <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-2">
                    <ShoppingCart className="size-5" style={{ color: PRIMARY }} />
                    <span className="font-semibold" style={{ color: INK }}>Pesanan</span>
                    {isConfirmMode && <Badge style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY, border: 'none' }}>Konfirmasi</Badge>}
                    {items.length > 0 && (
                        <Badge style={{ backgroundColor: `${PRIMARY}10`, color: PRIMARY, border: 'none' }}>
                            {items.reduce((s, i) => s + i.qty, 0)}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {items.length === 0 ? (
                    <p className="py-8 text-center text-sm" style={{ color: MUTED }}>Belum ada item</p>
                ) : (
                    items.map((item, i) => {
                        const itemTotal = (Number(item.menu.price) + item.selectedOptions.reduce((s, o) => s + o.adjustment, 0)) * item.qty;
                        return (
                            <div key={i} className="rounded-xl p-3" style={{ border: `1px solid ${BORDER}`, backgroundColor: `${CREAM}60` }}>
                                <div className="flex items-start justify-between">
                                    <span className="text-sm font-medium" style={{ color: INK }}>{item.menu.name}</span>
                                    <Button variant="ghost" size="icon" className="size-6" onClick={() => onRemove(i)}>
                                        <X className="size-3" style={{ color: MUTED }} />
                                    </Button>
                                </div>
                                {item.selectedOptions.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {item.selectedOptions.map((o, oi) => (
                                            <span
                                                key={oi}
                                                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                                style={{ backgroundColor: `${PRIMARY}10`, color: PRIMARY }}
                                            >
                                                {o.name}{o.adjustment > 0 ? ` +${o.adjustment.toLocaleString('id-ID')}` : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {item.notes && (
                                    <p className="text-xs" style={{ color: MUTED }}>Catatan: {item.notes}</p>
                                )}
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="size-7" onClick={() => onUpdateQty(i, item.qty - 1)} style={{ borderColor: BORDER }}>
                                            <Minus className="size-3" />
                                        </Button>
                                        <span className="w-6 text-center text-sm font-medium" style={{ color: INK }}>{item.qty}</span>
                                        <Button variant="outline" size="icon" className="size-7" onClick={() => onUpdateQty(i, item.qty + 1)} style={{ borderColor: BORDER }}>
                                            <Plus className="size-3" />
                                        </Button>
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: PRIMARY }}>Rp {itemTotal.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                {!isConfirmMode && !showPrintButton && (
                    <div className="mb-3 flex gap-2">
                        {items.length > 0 && (
                            <>
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDiscount(!showDiscount)} style={{ borderColor: BORDER, color: INK }}>
                                    <Percent className="mr-1 size-3" /> Diskon
                                </Button>
                                {!pendingOrderId && splitCount === 1 && (
                                    <Button variant="outline" size="sm" className="flex-1" onClick={onOpenSplitBill} style={{ borderColor: BORDER, color: INK }}>
                                        <SplitSquareVertical className="mr-1 size-3" /> Split
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {showDiscount && items.length > 0 && !isConfirmMode && !showPrintButton && (
                    <div className="mb-3 rounded-xl p-3" style={{ border: `1px solid ${BORDER}`, backgroundColor: `${CREAM}80` }}>
                        <div className="mb-2 flex gap-2">
                            <Button
                                variant={discountType === 'percentage' ? 'default' : 'outline'}
                                size="sm" className="h-8 flex-1 text-xs"
                                style={discountType === 'percentage' ? { backgroundColor: PRIMARY } : { borderColor: BORDER, color: INK }}
                                onClick={() => onDiscountChange('percentage', discountValue)}
                            >Persen (%)</Button>
                            <Button
                                variant={discountType === 'nominal' ? 'default' : 'outline'}
                                size="sm" className="h-8 flex-1 text-xs"
                                style={discountType === 'nominal' ? { backgroundColor: PRIMARY } : { borderColor: BORDER, color: INK }}
                                onClick={() => onDiscountChange('nominal', discountValue)}
                            >Nominal (Rp)</Button>
                        </div>
                        {discountType && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number" min={0} max={discountType === 'percentage' ? 100 : undefined}
                                    placeholder={discountType === 'percentage' ? '10%' : 'Rp 10.000'}
                                    value={discountValue || ''}
                                    onChange={e => onDiscountChange(discountType, Number(e.target.value))}
                                    className="h-8 text-sm"
                                />
                                <span className="whitespace-nowrap text-sm font-medium" style={{ color: INK }}>
                                    {discountType === 'percentage' ? '%' : 'Rp'}
                                </span>
                            </div>
                        )}
                        {discountAmount > 0 && (
                            <div className="mt-2 space-y-1 text-xs">
                                <div className="flex justify-between" style={{ color: MUTED }}>
                                    <span>Diskon</span>
                                    <span className="font-medium" style={{ color: '#059669' }}>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                                </div>
                                {needsApproval && !discountApprovedBy && (
                                    <div className="flex items-center gap-1" style={{ color: '#d97706' }}>
                                        <ShieldCheck className="size-3" />
                                        <span>Perlu persetujuan Admin</span>
                                    </div>
                                )}
                                {discountApprovedBy && (
                                    <div className="flex items-center gap-1" style={{ color: '#059669' }}>
                                        <ShieldCheck className="size-3" />
                                        <span>Disetujui Admin</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {splitCount > 1 && !showPrintButton && (
                    <div className="mb-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs" style={{ border: `1px solid ${BORDER}`, backgroundColor: `${CREAM}80` }}>
                        <span style={{ color: MUTED }}>Split bill</span>
                        <span className="font-medium" style={{ color: INK }}>{splitCount} bagian</span>
                    </div>
                )}

                <div className="mb-2 space-y-1 text-sm">
                    <div className="flex justify-between" style={{ color: MUTED }}>
                        <span>Subtotal</span>
                        <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between" style={{ color: '#059669' }}>
                            <span>Diskon</span>
                            <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                        </div>
                    )}
                </div>
                <div className="mb-4 flex items-center justify-between text-lg font-bold" style={{ color: INK }}>
                    <span>Total</span>
                    <span style={{ color: PRIMARY }}>Rp {total.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex flex-col gap-2">
                    {isConfirmMode ? (
                        <Button onClick={onConfirmPay} disabled={items.length === 0 || confirmPayProcessing} className="w-full" size="lg" style={{ backgroundColor: PRIMARY }}>
                            {confirmPayProcessing ? 'Memproses...' : 'Konfirmasi & Bayar'}
                        </Button>
                    ) : showPrintButton ? (
                        <Button onClick={onPrintReceipt} className="w-full" size="lg" style={{ backgroundColor: PRIMARY }}>
                            <Printer className="mr-2 size-4" /> Cetak Struk
                        </Button>
                    ) : (
                        <>
                            {needsApproval && discountAmount > 0 && !discountApprovedBy ? (
                                <Button onClick={onOpenApproval} className="w-full" size="lg" style={{ backgroundColor: PRIMARY }}>
                                    <ShieldCheck className="mr-2 size-4" /> Setujui Diskon & Bayar
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={() => onOrder('cash')} disabled={items.length === 0 || processing || !tableSelected} className="w-full" size="lg" style={{ backgroundColor: PRIMARY }}>
                                        <Wallet className="mr-2 size-4" /> Bayar Cash
                                    </Button>
                                    <Button onClick={() => onOrder('qris')} disabled={items.length === 0 || processing || !tableSelected} variant="secondary" className="w-full" size="lg" style={{ backgroundColor: SAND, color: INK }}>
                                        <QrCode className="mr-2 size-4" /> Bayar QRIS
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                    {!isConfirmMode && !tableSelected && items.length > 0 && !showPrintButton && (
                        <p className="mt-1 text-center text-xs" style={{ color: '#d97706' }}>
                            Pilih meja terlebih dahulu
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo, useRef } from 'react';
import {
    Search, ShoppingCart, Check,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { BORDER, CREAM, INK, MUTED, PRIMARY, SAND, TABLE_COLORS } from './constants';
import type { CartItem, MenuItem, PendingOrder, PosPageProps } from './types';
import MenuCard from './components/MenuCard';
import CartPanel from './components/CartPanel';
import ItemDialog from './dialogs/ItemDialog';
import PaymentDialog from './dialogs/PaymentDialog';
import ApprovalDialog from './dialogs/ApprovalDialog';
import SplitBillDialog from './dialogs/SplitBillDialog';
import CashPaymentDialog from './dialogs/CashPaymentDialog';
import QrisPaymentDialog from './dialogs/QrisPaymentDialog';
import SuccessDialog from './dialogs/SuccessDialog';

export default function PosIndex({ categories, tables, pendingOrders }: PosPageProps) {
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
        () => categories.length > 0 ? categories[0].id : null
    );
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [itemDialogMenu, setItemDialogMenu] = useState<MenuItem | null>(null);
    const [selectedPendingOrderId, setSelectedPendingOrderId] = useState<number | null>(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [confirmPayProcessing, setConfirmPayProcessing] = useState(false);
    const [discountType, setDiscountType] = useState<string | null>(null);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountApprovedBy, setDiscountApprovedBy] = useState<number | null>(null);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [approvalPassword, setApprovalPassword] = useState('');
    const [approvalError, setApprovalError] = useState('');
    const [approvalProcessing, setApprovalProcessing] = useState(false);
    const [splitDialogOpen, setSplitDialogOpen] = useState(false);
    const [splitCount, setSplitCount] = useState(1);
    const [splitInputValue, setSplitInputValue] = useState('2');
    const [showPrintButton, setShowPrintButton] = useState(false);
    const [printReceiptData, setPrintReceiptData] = useState<{ items: CartItem[]; discountType: string | null; discountValue: number } | null>(null);
    const [cashDialogOpen, setCashDialogOpen] = useState(false);
    const [cashAmountGiven, setCashAmountGiven] = useState(0);
    const [qrisDialogOpen, setQrisDialogOpen] = useState(false);
    const [qrisProcessing, setQrisProcessing] = useState(false);
    const [qrisQrCodeUrl, setQrisQrCodeUrl] = useState<string | null>(null);
    const [qrisError, setQrisError] = useState<string | null>(null);
    const [qrisOrderId, setQrisOrderId] = useState<number | null>(null);
    const qrisOrderIdRef = useRef<number | null>(null);
    const [qrisPaymentStatus, setQrisPaymentStatus] = useState<'pending' | 'settlement' | 'failed'>('pending');
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successType, setSuccessType] = useState<'cash' | 'qris' | 'save'>('cash');
    const [isPendingCashPayment, setIsPendingCashPayment] = useState(false);
    const [successChange, setSuccessChange] = useState(0);
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    const subtotal = useMemo(() => cartItems.reduce((sum, item) => {
        const optAdj = item.selectedOptions.reduce((s, o) => s + o.adjustment, 0);
        return sum + (Number(item.menu.price) + optAdj) * item.qty;
    }, 0), [cartItems]);
    const discountAmount = useMemo(() => {
        if (!discountType || !discountValue) return 0;
        if (discountType === 'percentage') return Math.min(subtotal * (discountValue / 100), subtotal);
        return Math.min(discountValue, subtotal);
    }, [subtotal, discountType, discountValue]);
    const total = subtotal - discountAmount;

    const { setData, post, processing } = useForm({
        table_id: null as number | null,
        items: [] as { menu_id: number; qty: number; notes: string | null; option_ids: number[] }[],
        payment_method: null as string | null,
        discount_type: null as string | null,
        discount_value: null as number | null,
        discount_approved_by: null as number | null,
        split_count: null as number | null,
    });

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
    const allMenus = useMemo(() => categories.flatMap(c => c.menus), [categories]);

    const visibleMenus = useMemo(() => {
        if (!searchQuery && selectedCategory) return selectedCategory.menus.filter(m => m.is_available);
        const lowered = searchQuery.toLowerCase();
        return allMenus.filter(m => m.is_available && m.name.toLowerCase().includes(lowered));
    }, [searchQuery, selectedCategory, allMenus]);

    function handleAddToCart(menu: MenuItem, qty: number, notes: string, selectedOptions: CartItem['selectedOptions']) {
        setCartItems(prev => {
            const existing = prev.findIndex(item =>
                item.menu.id === menu.id &&
                item.notes === notes &&
                JSON.stringify(item.selectedOptions.map(o => o.itemId).sort()) === JSON.stringify(selectedOptions.map(o => o.itemId).sort())
            );
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { ...updated[existing], qty: updated[existing].qty + qty };
                return updated;
            }
            return [...prev, { menu, qty, notes, selectedOptions }];
        });
    }

    function handleDiscountChange(type: string | null, value: number) {
        if (type === null) {
            setDiscountType(null);
            setDiscountValue(0);
            setDiscountApprovedBy(null);
        } else if (discountType === type) {
            setDiscountValue(value);
        } else {
            setDiscountType(type);
            setDiscountValue(value);
            setDiscountApprovedBy(null);
        }
    }

    function getCsrfToken(): string {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.getAttribute('content') ?? '';
    }

    function handleSubmitApproval() {
        if (!approvalPassword) return;
        setApprovalProcessing(true);
        setApprovalError('');

        fetch('/pos/verify-approval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
            body: JSON.stringify({ password: approvalPassword }),
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) {
                    setApprovalError(data.message || 'Terjadi kesalahan');
                    setApprovalProcessing(false);
                    return;
                }
                setDiscountApprovedBy(data.approved_by);
                setApprovalDialogOpen(false);
                setApprovalProcessing(false);
            })
            .catch(() => {
                setApprovalError('Terjadi kesalahan jaringan');
                setApprovalProcessing(false);
            });
    }

    function handleOrder(paymentMethod?: string) {
        if (cartItems.length === 0) return;
        if (paymentMethod === 'cash') {
            setCashDialogOpen(true);
            return;
        }
        if (paymentMethod === 'qris') {
            handleInitiateQris();
            return;
        }
        if (!selectedTableId) return;
        setData({
            table_id: selectedTableId,
            items: cartItems.map(item => ({
                menu_id: item.menu.id,
                qty: item.qty,
                notes: item.notes || null,
                option_ids: item.selectedOptions.map(o => o.itemId),
            })),
            payment_method: null,
            discount_type: discountValue > 0 ? discountType : null,
            discount_value: discountValue > 0 ? discountValue : null,
            discount_approved_by: discountApprovedBy,
            split_count: splitCount > 1 ? splitCount : null,
        });
        setPrintReceiptData({ items: [...cartItems], discountType, discountValue });
        post('/pos/orders', {
            preserveScroll: true,
            onSuccess: () => {
                resetAfterOrder();
                setSuccessType('save');
                setSuccessChange(0);
                setSuccessDialogOpen(true);
            },
        });
    }

    function handleCashConfirm(amountGiven: number) {
        if (cartItems.length === 0 || !selectedTableId) return;
        setCashAmountGiven(amountGiven);
        setData({
            table_id: selectedTableId,
            items: cartItems.map(item => ({
                menu_id: item.menu.id,
                qty: item.qty,
                notes: item.notes || null,
                option_ids: item.selectedOptions.map(o => o.itemId),
            })),
            payment_method: 'cash',
            discount_type: discountValue > 0 ? discountType : null,
            discount_value: discountValue > 0 ? discountValue : null,
            discount_approved_by: discountApprovedBy,
            split_count: splitCount > 1 ? splitCount : null,
        });
        setPrintReceiptData({ items: [...cartItems], discountType, discountValue });
        post('/pos/orders', {
            preserveScroll: true,
            onSuccess: () => {
                setCashDialogOpen(false);
                setSuccessType('cash');
                setSuccessChange(amountGiven - total);
                setSuccessDialogOpen(true);
                resetAfterOrder();
            },
        });
    }

    function handleInitiateQris() {
        if (cartItems.length === 0) return;
        setQrisDialogOpen(true);
        setQrisProcessing(true);
        setQrisQrCodeUrl(null);
        setQrisError(null);
        setQrisPaymentStatus('pending');

        fetch('/pos/orders/qris-init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
            body: JSON.stringify({
                table_id: selectedTableId,
                items: cartItems.map(item => ({
                    menu_id: item.menu.id,
                    qty: item.qty,
                    notes: item.notes || null,
                    option_ids: item.selectedOptions.map(o => o.itemId),
                })),
                discount_type: discountValue > 0 ? discountType : null,
                discount_value: discountValue > 0 ? discountValue : null,
                discount_approved_by: discountApprovedBy,
            }),
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                setQrisProcessing(false);
                if (!ok) {
                    setQrisError(data.message || 'Gagal memproses QRIS');
                    return;
                }
                setQrisOrderId(data.order_id);
                qrisOrderIdRef.current = data.order_id;
                setQrisQrCodeUrl(data.qr_code);
                setPrintReceiptData({ items: [...cartItems], discountType, discountValue });
            })
            .catch(() => {
                setQrisProcessing(false);
                setQrisError('Terjadi kesalahan jaringan');
            });
    }

    function handleQrisClose() {
        setQrisDialogOpen(false);
        setQrisOrderId(null);
        qrisOrderIdRef.current = null;
        setQrisQrCodeUrl(null);
        setQrisError(null);
        setQrisPaymentStatus('pending');
        if (qrisPaymentStatus === 'settlement') {
            setSuccessDialogOpen(true);
        }
    }

    function handleQrisPoll() {
        const id = qrisOrderIdRef.current;
        if (!id) return;
        fetch(`/pos/orders/${id}/qris-status`, {
            headers: { 'Accept': 'application/json' },
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'settlement') {
                    setQrisPaymentStatus('settlement');
                    resetAfterOrder();
                    setTimeout(() => {
                        setQrisDialogOpen(false);
                        setSuccessType('qris');
                        setSuccessChange(0);
                        setSuccessDialogOpen(true);
                    }, 1500);
                } else if (data.status === 'failed') {
                    setQrisPaymentStatus('failed');
                }
            })
            .catch(() => {});
    }

    function resetAfterOrder() {
        setCartItems([]);
        setSelectedTableId(null);
        setSelectedPendingOrderId(null);
        setCartOpen(false);
        setDiscountType(null);
        setDiscountValue(0);
        setDiscountApprovedBy(null);
        setSplitCount(1);
        setShowPrintButton(true);
    }

    function handleSuccessClose() {
        setSuccessDialogOpen(false);
    }

    function handleSelectPendingOrder(order: PendingOrder) {
        setSelectedPendingOrderId(order.id);
        setCartItems(order.items.map(item => ({
            menu: { ...item.menu, description: null, photo_path: null, option_groups: [], is_available: true } as MenuItem,
            qty: item.qty,
            notes: item.notes || '',
            selectedOptions: item.options.map(o => ({
                itemId: o.option_item.id,
                name: o.option_item.name,
                adjustment: Number(o.option_item.price_adjustment),
            })),
        })));
    }

    function handlePaymentMethodSelect(method: string) {
        if (method === 'cash') {
            setPaymentDialogOpen(false);
            setIsPendingCashPayment(true);
            setCashDialogOpen(true);
        } else {
            handleConfirmPay('qris');
        }
    }

    function handlePendingCashConfirm(amountGiven: number) {
        if (!selectedPendingOrderId || cartItems.length === 0) return;
        setCashAmountGiven(amountGiven);
        setCashDialogOpen(false);
        setConfirmPayProcessing(true);
        setPrintReceiptData({ items: [...cartItems], discountType, discountValue });

        router.put(`/pos/orders/${selectedPendingOrderId}/confirm-pay`, {
            items: cartItems.map(item => ({
                menu_id: item.menu.id,
                qty: item.qty,
                notes: item.notes || null,
                option_ids: item.selectedOptions.map(o => o.itemId),
            })),
            payment_method: 'cash',
            discount_type: discountValue > 0 ? discountType : null,
            discount_value: discountValue > 0 ? discountValue : null,
            discount_approved_by: discountApprovedBy,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmPayProcessing(false);
                setIsPendingCashPayment(false);
                resetAfterOrder();
                setSuccessType('cash');
                setSuccessChange(amountGiven - total);
                setSuccessDialogOpen(true);
            },
            onError: () => {
                setConfirmPayProcessing(false);
                setIsPendingCashPayment(false);
            },
        });
    }

    function handleConfirmPay(method: string) {
        if (!selectedPendingOrderId || cartItems.length === 0) return;
        setConfirmPayProcessing(true);
        setPrintReceiptData({ items: [...cartItems], discountType, discountValue });

        router.put(`/pos/orders/${selectedPendingOrderId}/confirm-pay`, {
            items: cartItems.map(item => ({
                menu_id: item.menu.id,
                qty: item.qty,
                notes: item.notes || null,
                option_ids: item.selectedOptions.map(o => o.itemId),
            })),
            payment_method: method,
            discount_type: discountValue > 0 ? discountType : null,
            discount_value: discountValue > 0 ? discountValue : null,
            discount_approved_by: discountApprovedBy,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmPayProcessing(false);
                setPaymentDialogOpen(false);
                resetAfterOrder();
                setSuccessType(method === 'qris' ? 'qris' : 'cash');
                setSuccessChange(0);
                setSuccessDialogOpen(true);
            },
            onError: () => setConfirmPayProcessing(false),
        });
    }

    function handlePrintReceipt() {
        const data = printReceiptData;
        if (!data || data.items.length === 0) return;

        const { items, discountType, discountValue } = data;
        const subtotal = items.reduce((sum, item) => {
            const optAdj = item.selectedOptions.reduce((s, o) => s + o.adjustment, 0);
            return sum + (Number(item.menu.price) + optAdj) * item.qty;
        }, 0);

        const discountAmount = discountType && discountValue > 0
            ? (discountType === 'percentage'
                ? Math.min(subtotal * (discountValue / 100), subtotal)
                : Math.min(discountValue, subtotal))
            : 0;

        const total = subtotal - discountAmount;

        const receiptHtml = `<!DOCTYPE html>
                                <html>
                                <head>
                                <meta charset="utf-8">
                                <title>Struk Pembayaran</title>
                                <style>
                                    @page { margin: 0; size: 80mm auto; }
                                    * { margin: 0; padding: 0; box-sizing: border-box; }
                                    body {
                                        font-family: 'Courier New', monospace;
                                        font-size: 12px;
                                        width: 72mm;
                                        padding: 10px 5mm;
                                        color: #000;
                                    }
                                    .header { text-align: center; margin-bottom: 10px; }
                                    .header h2 { font-size: 16px; margin-bottom: 4px; }
                                    .header p { font-size: 10px; color: #555; }
                                    .divider { border-top: 1px dashed #000; margin: 8px 0; }
                                    .items { width: 100%; }
                                    .items th { text-align: left; font-size: 10px; padding-bottom: 4px; }
                                    .items td { padding: 2px 0; }
                                    .items .right { text-align: right; }
                                    .totals { margin-top: 8px; }
                                    .totals .row { display: flex; justify-content: space-between; padding: 2px 0; }
                                    .totals .grand { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
                                    .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #555; }
                                </style>
                                </head>
                                <body>
                                    <div class="header">
                                        <img src="/img/lws-logo.png" alt="Logo" style="max-width: 50px; margin-bottom: 4px;">
                                        <h2>LW's by Bubur Kang LW</h2>
                                        <p>Jl. Angkatan 45, Palembang</p>
                                        <p>Telp: 0813-1234-5678</p>
                                        <p>${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p>${new Date().toLocaleTimeString('id-ID')}</p>
                                    </div>
                                    <div class="divider"></div>
                                    <table class="items" cellpadding="2">
                                        <tr>
                                            <th>Item</th>
                                            <th class="right">Qty</th>
                                            <th class="right">Harga</th>
                                        </tr>
                                        ${items.map(item => `
                                        <tr>
                                            <td colspan="3">${item.menu.name}</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td class="right">${item.qty}</td>
                                            <td class="right">Rp ${((Number(item.menu.price) + item.selectedOptions.reduce((s, o) => s + o.adjustment, 0)) * item.qty).toLocaleString('id-ID')}</td>
                                        </tr>
                                        ${item.selectedOptions.length > 0 ? `<tr><td colspan="3" style="font-size:10px;color:#888;">  ${item.selectedOptions.map(o => o.name).join(', ')}</td></tr>` : ''}
                                        ${item.notes ? `<tr><td colspan="3" style="font-size:10px;color:#888;">  Catatan: ${item.notes}</td></tr>` : ''}
                                        `).join('')}
                                    </table>
                                    <div class="divider"></div>
                                    <div class="totals">
                                        <div class="row">
                                            <span>Subtotal</span>
                                            <span>Rp ${subtotal.toLocaleString('id-ID')}</span>
                                        </div>
                                        ${discountAmount > 0 ? `
                                        <div class="row">
                                            <span>Diskon</span>
                                            <span>-Rp ${discountAmount.toLocaleString('id-ID')}</span>
                                        </div>
                                        ` : ''}
                                        <div class="row grand">
                                            <span>Total</span>
                                            <span>Rp ${total.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                    <div class="divider"></div>
                                    <div class="footer">
                                        <p>Terima kasih telah berbelanja!</p>
                                        <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
                                    </div>
                                </body>
                                </html>`;

        const iframe = printFrameRef.current;
        if (!iframe || !iframe.contentWindow) return;

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(receiptHtml);
        doc.close();

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            }, 300);
        };
    }

    const cartPanelProps = {
        items: cartItems,
        processing,
        pendingOrderId: selectedPendingOrderId,
        confirmPayProcessing,
        tableSelected: selectedTableId !== null,
        onUpdateQty: (i: number, q: number) => setCartItems(prev => q < 1 ? prev : prev.map((item, idx) => idx === i ? { ...item, qty: q } : item)),
        onRemove: (i: number) => setCartItems(prev => prev.filter((_, idx) => idx !== i)),
        onOrder: handleOrder,
        onConfirmPay: () => setPaymentDialogOpen(true),
        discountType,
        discountValue,
        discountApprovedBy,
        onDiscountChange: handleDiscountChange,
        onOpenApproval: () => { setApprovalDialogOpen(true); setApprovalPassword(''); setApprovalError(''); },
        splitCount,
        onOpenSplitBill: () => setSplitDialogOpen(true),
        onPrintReceipt: handlePrintReceipt,
        showPrintButton,
    };

    return (
        <>
            <Head title="POS Kasir" />
            <div className="flex h-screen overflow-hidden" style={{ backgroundColor: CREAM }}>
                <aside className="hidden w-80 flex-shrink-0 flex-col overflow-y-auto p-4 lg:flex" style={{ borderRight: `1px solid ${BORDER}` }}>
                    <div className="flex-1 space-y-4">
                        {pendingOrders.length > 0 && (
                            <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                                <h2 className="text-base font-semibold" style={{ color: INK }}>Pesanan Baru</h2>
                                <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Menunggu konfirmasi</p>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {pendingOrders.map(order => (
                                        <button
                                            key={order.id}
                                            onClick={() => handleSelectPendingOrder(order)}
                                            className={cn(
                                                'w-full rounded-xl p-3 text-left transition-all',
                                                selectedPendingOrderId === order.id ? 'ring-1' : 'hover:opacity-80'
                                            )}
                                            style={{
                                                border: `1px solid ${selectedPendingOrderId === order.id ? PRIMARY : BORDER}`,
                                                backgroundColor: selectedPendingOrderId === order.id ? `${PRIMARY}08` : CREAM,
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
                        )}
                        <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                            <h2 className="text-base font-semibold" style={{ color: INK }}>Meja</h2>
                            <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Pilih meja</p>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {tables.map(table => {
                                    const isSelected = selectedTableId === table.id;
                                    const bgColor = isSelected ? PRIMARY : (TABLE_COLORS[table.status] || '#9ca3af');
                                    const textColor = isSelected || table.status !== 'available' ? '#fff' : INK;
                                    return (
                                        <button
                                            key={table.id}
                                            onClick={() => setSelectedTableId(isSelected ? null : table.id)}
                                            className={cn(
                                                'relative flex flex-col items-center rounded-xl p-3 text-sm font-medium transition-all hover:opacity-90',
                                                isSelected && 'ring-1',
                                            )}
                                            style={{
                                                backgroundColor: bgColor,
                                                color: textColor,
                                                ...(isSelected ? { ringColor: SAND } : {}),
                                            }}
                                        >
                                            <span className="text-lg font-bold">{table.code}</span>
                                            <span className="mt-0.5 text-[10px] opacity-80">{table.capacity} org</span>
                                            {isSelected && (
                                                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full" style={{ backgroundColor: SAND, color: INK }}>
                                                    <Check className="size-3" />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex gap-2 overflow-x-auto p-3 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {tables.map(table => {
                            const isSelected = selectedTableId === table.id;
                            const bgColor = isSelected ? PRIMARY : (TABLE_COLORS[table.status] || '#9ca3af');
                            const textColor = isSelected || table.status !== 'available' ? '#fff' : INK;
                            return (
                                <button
                                    key={table.id}
                                    onClick={() => setSelectedTableId(isSelected ? null : table.id)}
                                    className="relative flex-shrink-0 rounded-xl px-4 py-2 text-xs font-medium"
                                    style={{
                                        backgroundColor: bgColor,
                                        color: textColor,
                                        ...(isSelected ? { outline: `2px solid ${SAND}`, outlineOffset: '2px' } : {}),
                                    }}
                                >
                                    {table.code}
                                    {isSelected && (
                                        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full" style={{ backgroundColor: SAND, color: INK }}>
                                            <Check className="size-2.5" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {pendingOrders.length > 0 && (
                        <div className="overflow-x-auto p-3 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: CREAM }}>
                            <h2 className="mb-2 text-sm font-semibold" style={{ color: INK }}>Pesanan Baru</h2>
                            <div className="flex gap-2">
                                {pendingOrders.map(order => (
                                    <button
                                        key={order.id}
                                        onClick={() => handleSelectPendingOrder(order)}
                                        className="flex-shrink-0 rounded-xl p-3 text-left transition-all"
                                        style={{
                                            border: `1px solid ${selectedPendingOrderId === order.id ? PRIMARY : BORDER}`,
                                            backgroundColor: selectedPendingOrderId === order.id ? `${PRIMARY}08` : '#fff',
                                            minWidth: '140px',
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
                                        <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                                            {order.customer_name || 'Tanpa nama'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 overflow-x-auto px-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className="flex-shrink-0 px-3 py-3 text-sm font-medium transition-colors"
                                style={{
                                    borderBottom: '2px solid',
                                    borderColor: selectedCategoryId === cat.id ? PRIMARY : 'transparent',
                                    color: selectedCategoryId === cat.id ? PRIMARY : MUTED,
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: MUTED }} />
                            <Input
                                placeholder="Cari menu..."
                                className="border-0 bg-white pl-9 shadow-sm"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {visibleMenus.map(menu => (
                                <MenuCard key={menu.id} menu={menu} onSelect={() => { setItemDialogMenu(menu); setItemDialogOpen(true); }} />
                            ))}
                            {visibleMenus.length === 0 && (
                                <p className="col-span-full py-8 text-center text-sm" style={{ color: MUTED }}>
                                    Menu tidak ditemukan
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="hidden w-96 flex-shrink-0 lg:flex lg:flex-col" style={{ borderLeft: `1px solid ${BORDER}` }}>
                    <CartPanel {...cartPanelProps} />
                </aside>

                <button
                    onClick={() => setCartOpen(true)}
                    className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full text-white shadow-lg lg:hidden"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <ShoppingCart className="size-6" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {cartCount}
                        </span>
                    )}
                </button>

                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                    <SheetContent side="bottom" className="h-[85vh]" style={{ backgroundColor: CREAM }}>
                        <SheetHeader>
                            <SheetTitle style={{ color: INK }}>Pesanan</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto pt-4">
                            <CartPanel {...cartPanelProps} />
                        </div>
                    </SheetContent>
                </Sheet>

                <ItemDialog
                    open={itemDialogOpen}
                    onOpenChange={setItemDialogOpen}
                    menu={itemDialogMenu}
                    onAdd={handleAddToCart}
                />

                <PaymentDialog
                    open={paymentDialogOpen}
                    onOpenChange={setPaymentDialogOpen}
                    onConfirm={handlePaymentMethodSelect}
                    processing={confirmPayProcessing}
                />

                <ApprovalDialog
                    open={approvalDialogOpen}
                    onOpenChange={setApprovalDialogOpen}
                    password={approvalPassword}
                    onPasswordChange={setApprovalPassword}
                    onSubmit={handleSubmitApproval}
                    error={approvalError}
                    processing={approvalProcessing}
                />

                <SplitBillDialog
                    open={splitDialogOpen}
                    onOpenChange={setSplitDialogOpen}
                    splitInputValue={splitInputValue}
                    onSplitInputChange={setSplitInputValue}
                    onApply={(count) => { setSplitCount(Math.max(2, Math.min(20, count))); setSplitDialogOpen(false); }}
                    cartItems={cartItems}
                />

                <CashPaymentDialog
                    open={cashDialogOpen}
                    onOpenChange={v => { setCashDialogOpen(v); if (!v) setIsPendingCashPayment(false); }}
                    total={total}
                    onConfirm={isPendingCashPayment ? handlePendingCashConfirm : handleCashConfirm}
                    processing={processing}
                />

                <QrisPaymentDialog
                    open={qrisDialogOpen}
                    onOpenChange={handleQrisClose}
                    total={total}
                    qrCodeUrl={qrisQrCodeUrl}
                    processing={qrisProcessing}
                    error={qrisError}
                    onPoll={handleQrisPoll}
                    onCancel={handleQrisClose}
                    paymentStatus={qrisPaymentStatus}
                />

                <SuccessDialog
                    open={successDialogOpen}
                    onClose={handleSuccessClose}
                    onPrint={handlePrintReceipt}
                    type={successType}
                    changeAmount={successChange}
                />
            </div>

            <iframe ref={printFrameRef} style={{ position: 'absolute', width: 0, height: 0, border: 'none' }} title="print-frame" />
        </>
    );
}

PosIndex.layout = null;

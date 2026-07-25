import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Check, X, Move, ArrowRightLeft, Lock, Link, HandPlatter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BORDER, CREAM, INK, MUTED, PRIMARY, SAND, TABLE_COLORS } from './constants';
import type { CartItem, MenuItem, PendingOrder, PosPageProps, OrderData, PrintReceiptData, TableData } from './types';
import MenuCard from './components/MenuCard';
import CartPanel from './components/CartPanel';
import ItemDialog from './dialogs/ItemDialog';
import PaymentDialog from './dialogs/PaymentDialog';
import ApprovalDialog from './dialogs/ApprovalDialog';
import SplitBillDialog from './dialogs/SplitBillDialog';
import CashPaymentDialog from './dialogs/CashPaymentDialog';
import MidtransPaymentDialog from './dialogs/MidtransPaymentDialog';
import SuccessDialog from './dialogs/SuccessDialog';
import MoveMergeDialog from './dialogs/MoveMergeDialog';

export default function PosIndex({ categories, tables, pendingOrders, lastOrder, groupedTables }: PosPageProps) {
    const { auth } = usePage().props as { auth: { user: { id: number; name: string } | null } };
    const cashierName = auth?.user?.name ?? '';
    const [selectedTableIds, setSelectedTableIds] = useState<number[]>([]);
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
    const [printReceiptData, setPrintReceiptData] = useState<PrintReceiptData | null>(null);
    const [cashDialogOpen, setCashDialogOpen] = useState(false);
    const [cashAmountGiven, setCashAmountGiven] = useState(0);
    const [midtransDialogOpen, setMidtransDialogOpen] = useState(false);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successType, setSuccessType] = useState<'cash' | 'qris' | 'save'>('cash');
    const [isPendingCashPayment, setIsPendingCashPayment] = useState(false);
    const [successChange, setSuccessChange] = useState(0);
    const [receiptOrder, setReceiptOrder] = useState<OrderData | null>(lastOrder ?? null);
    const printFrameRef = useRef<HTMLIFrameElement>(null);
    const [releaseDialogTable, setReleaseDialogTable] = useState<{ id: number; code: string } | null>(null);
    const [moveMergeDialog, setMoveMergeDialog] = useState<{ mode: 'move' | 'merge'; sourceTable: { id: number; code: string } } | null>(null);

    useEffect(() => {
        if (lastOrder) {
            setReceiptOrder(lastOrder);
        }
    }, [lastOrder]);

    const groupedBy = useMemo(() => {
        const map: Record<number, number> = {};
        if (groupedTables) {
            for (const [mainId, extras] of Object.entries(groupedTables)) {
                for (const extraId of extras) {
                    map[extraId] = Number(mainId);
                }
            }
        }
        return map;
    }, [groupedTables]);

    function getGroupLabel(tableId: number): string | null {
        const mainId = groupedBy[tableId];
        if (mainId) {
            const mainTable = tables.find(t => t.id === mainId);
            return `${mainTable?.code ?? `Meja ${mainId}`}`;
        }
        const extras = groupedTables?.[tableId];
        if (extras?.length) {
            const extraTables = tables.filter(t => extras.includes(t.id));
            return `+${extras.length} ${extraTables.map(t => t.code).join(', ')}`;
        }
        return null;
    }

    const subtotal = useMemo(() => cartItems.reduce((sum, item) => {
        const optAdj = item.selectedOptions.reduce((s, o) => s + o.adjustment, 0);
        return sum + (Number(item.menu.price) + optAdj) * item.qty;
    }, 0), [cartItems]);
    const discountAmount = useMemo(() => {
        if (!discountType || !discountValue) return 0;
        if (discountType === 'percentage') return Math.min(subtotal * (discountValue / 100), subtotal);
        return Math.min(discountValue, subtotal);
    }, [subtotal, discountType, discountValue]);
    const tax = Math.round(subtotal * 0.10);
    const total = subtotal + tax - discountAmount;

    const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');

    const [customerName, setCustomerName] = useState('');

    const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

    const allFloors = useMemo(() => {
        const floors = tables.map(t => t.floor).filter((f): f is string => f !== null);
        return [...new Set(floors)];
    }, [tables]);

    const filteredTables = useMemo(() => {
        if (!selectedFloor) return tables;
        return tables.filter(t => t.floor === selectedFloor);
    }, [tables, selectedFloor]);

    const { setData, post, processing } = useForm({
        table_id: null as number | null,
        table_ids: [] as number[],
        items: [] as { menu_id: number; qty: number; notes: string | null; option_ids: number[] }[],
        payment_method: null as string | null,
        discount_type: null as string | null,
        discount_value: null as number | null,
        discount_approved_by: null as number | null,
        split_count: null as number | null,
        order_type: 'dine_in' as string,
        customer_name: null as string | null,
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
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) return token;
        const cookie = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
        if (cookie) return decodeURIComponent(cookie.split('=')[1]);
        return '';
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

    function handleTableClick(table: TableData) {
        if (table.status === 'occupied') {
            setReleaseDialogTable({ id: table.id, code: table.code });
            return;
        }
        if (table.status === 'locked' && table.locked_by && table.locked_by !== auth?.user?.id) {
            toast.error(`Meja sedang diproses oleh ${table.locked_by_user?.name || 'pengguna lain'}`);
            return;
        }
        setSelectedTableIds(prev =>
            prev.includes(table.id)
                ? prev.filter(id => id !== table.id)
                : [...prev, table.id]
        );
    }

    async function toggleLock(table: TableData) {
        const isLock = table.status === 'available';
        const res = await fetch(`/pos/tables/${table.id}/${isLock ? 'lock' : 'unlock'}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            toast.error(data?.message || (isLock ? 'Gagal mengunci meja' : 'Gagal unlock meja'));
            return;
        }
        router.reload();
    }

    function buildReceiptData(amountGiven?: number): PrintReceiptData {
        const pendingOrder = pendingOrders.find(o => o.id === selectedPendingOrderId);
        const selectedCodes = tables.filter(t => selectedTableIds.includes(t.id)).map(t => t.code).join(', ');
        const cashAmount = amountGiven ?? undefined;
        const change = amountGiven ? amountGiven - total : undefined;
        return {
            items: [...cartItems],
            discountType,
            discountValue,
            tableCode: selectedCodes || null,
            kasir: cashierName,
            customerName: pendingOrder?.customer_name ?? customerName,
            cashAmount: cashAmount && cashAmount >= total ? cashAmount : undefined,
            change: change && change >= 0 ? change : undefined,
        };
    }

    const isDineIn = orderType === 'dine_in';

    function handleOrder(paymentMethod?: string) {
        if (cartItems.length === 0) return;
        if (paymentMethod === 'cash') {
            setCashDialogOpen(true);
            return;
        }
        if (paymentMethod === 'online') {
            setPrintReceiptData(buildReceiptData());
            setMidtransDialogOpen(true);
            return;
        }
        if (isDineIn && selectedTableIds.length === 0) return;
        setData({
            table_id: isDineIn ? selectedTableIds[0] : null,
            table_ids: isDineIn ? selectedTableIds : [],
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
            order_type: orderType,
            customer_name: isDineIn ? null : customerName,
        });
        setPrintReceiptData(buildReceiptData());
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
        if (cartItems.length === 0 || (isDineIn && selectedTableIds.length === 0)) return;
        setCashAmountGiven(amountGiven);
        setData({
            table_id: isDineIn ? selectedTableIds[0] : null,
            table_ids: isDineIn ? selectedTableIds : [],
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
            order_type: orderType,
            customer_name: isDineIn ? null : customerName,
        });
        setPrintReceiptData(buildReceiptData(amountGiven));
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

    function handleMidtransSuccess(result: { orderNumber: string; paymentType: string; midtransCharge: number }) {
        setPrintReceiptData(prev => ({
            ...(prev ?? buildReceiptData()),
            orderNumber: result.orderNumber,
            paymentMethod: result.paymentType,
            midtransCharge: result.midtransCharge,
        }));
        resetAfterOrder();
        setMidtransDialogOpen(false);
        setSuccessType('qris');
        setSuccessChange(0);
        setSuccessDialogOpen(true);
    }

    function resetAfterOrder() {
        setCartItems([]);
        setSelectedTableIds([]);
        setSelectedPendingOrderId(null);
        setCartOpen(false);
        setDiscountType(null);
        setDiscountValue(0);
        setDiscountApprovedBy(null);
        setSplitCount(1);
        setShowPrintButton(true);
        setCustomerName('');
    }

    function handleSuccessClose() {
        setSuccessDialogOpen(false);
        setTimeout(() => router.visit('/pos', { preserveScroll: true }), 100);
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
        setPaymentDialogOpen(false);
        setIsPendingCashPayment(true);
        setCashDialogOpen(true);
    }

    function handlePendingCashConfirm(amountGiven: number) {
        if (!selectedPendingOrderId || cartItems.length === 0) return;
        setCashAmountGiven(amountGiven);
        setCashDialogOpen(false);
        setConfirmPayProcessing(true);
        setPrintReceiptData(buildReceiptData(amountGiven));

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
        setPrintReceiptData(buildReceiptData());

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

    function formatPrice(amount: number): string {
        return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
    }

    function handlePrintReceipt() {
        const data = printReceiptData;
        if (!data || data.items.length === 0) return;
        const { items, discountType, discountValue } = data;

        const order = receiptOrder;

        const subtotal = items.reduce((sum, item) => {
            const optAdj = item.selectedOptions.reduce((s, o) => s + o.adjustment, 0);
            return sum + (Number(item.menu.price) + optAdj) * item.qty;
        }, 0);
        const tax = roundP(subtotal * 0.10);
        const serviceCharge = roundP(subtotal * 0.05);
        const midtransCharge = data.midtransCharge ?? 0;
        const discountAmount = discountType && discountValue > 0
            ? (discountType === 'percentage'
                ? Math.min(subtotal * (discountValue / 100), subtotal)
                : Math.min(discountValue, subtotal))
            : 0;
        const total = subtotal + tax + serviceCharge + midtransCharge - discountAmount;

        const orderNumber = data.orderNumber
            ?? (order ? `TRX-LW-${order.id}` : null)
            ?? '—';
        const kasir = data.kasir ?? order?.created_by?.name ?? '';
        const tableCode = data.tableCode ?? order?.table_session?.table?.code ?? null;
        const customerName = data.customerName ?? order?.customer_name ?? null;
        const paymentMethod = data.paymentMethod ?? order?.payment?.method ?? null;
        const orderType = order?.order_type === 'cashier' ? 'Dine-in'
            : order?.order_type === 'dine_in_qr' ? 'Dine-in'
                : order?.order_type === 'takeaway' ? 'Take Away'
                    : order?.order_type ?? 'cashier';

        printReceiptHtml({
            orderNumber,
            createdAt: order?.created_at ?? new Date().toISOString(),
            kasir,
            orderType,
            tableCode,
            customerName,
            receiptItems: order
                ? order.items.map(i => ({
                    name: i.menu.name,
                    qty: i.qty,
                    basePrice: Number(i.base_price),
                    totalPrice: Number(i.total_price),
                    options: i.options.map(o => ({ name: o.option_item.name, price: Number(o.price_adjustment) })),
                    notes: i.notes,
                }))
                : items.map(i => ({
                    name: i.menu.name,
                    qty: i.qty,
                    basePrice: Number(i.menu.price),
                    totalPrice: (Number(i.menu.price) + i.selectedOptions.reduce((s, o) => s + o.adjustment, 0)) * i.qty,
                    options: i.selectedOptions.map(o => ({ name: o.name, price: o.adjustment })),
                    notes: i.notes || null,
                })),
            subtotal: order ? Number(order.subtotal) : subtotal,
            tax: order ? Number(order.tax) : tax,
            serviceCharge: order ? Number(order.service_charge) : serviceCharge,
            midtransCharge: order ? Number(order.midtrans_charge ?? 0) : midtransCharge,
            discount: order ? Number(order.discount) : discountAmount,
            discountLabel: order?.discount_type === 'percentage' ? `${order.discount_value}%`
                : discountType === 'percentage' ? `${discountValue}%`
                    : null,
            total: order ? Number(order.total) : total,
            paymentMethod,
            cashAmount: data.cashAmount,
            change: data.change,
        });
    }

    function roundP(n: number): number {
        return Math.round(n * 100) / 100;
    }

    function printReceiptHtml(data: {
        orderNumber: string;
        createdAt: string;
        kasir: string;
        orderType: string;
        tableCode: string | null;
        customerName: string | null;
        receiptItems: { name: string; qty: number; basePrice: number; totalPrice: number; options: { name: string; price: number }[]; notes: string | null }[];
        subtotal: number;
        tax: number;
        serviceCharge: number;
        midtransCharge: number;
        discount: number;
        discountLabel: string | null;
        total: number;
        paymentMethod: string | null;
        cashAmount?: number;
        change?: number;
    }) {
        const paymentLabel = data.paymentMethod === 'cash' ? 'Tunai'
            : data.paymentMethod === 'qris' ? 'QRIS'
                : data.paymentMethod === 'debit' ? 'Kartu Debit'
                    : data.paymentMethod === 'credit' ? 'Kartu Kredit'
                        : data.paymentMethod === 'gopay' ? 'GoPay'
                            : data.paymentMethod === 'shopeepay' ? 'ShopeePay'
                                : data.paymentMethod === 'bca_va' ? 'BCA VA'
                                    : data.paymentMethod === 'mandiri_va' ? 'Mandiri VA'
                                        : data.paymentMethod === 'bni_va' ? 'BNI VA'
                                            : data.paymentMethod === 'bri_va' ? 'BRI VA'
                                                : data.paymentMethod === 'permata_va' ? 'Permata VA'
                                                    : data.paymentMethod === 'echannel' ? 'Mandiri Bill'
                                                        : data.paymentMethod === 'indomaret' ? 'Indomaret'
                                                            : data.paymentMethod === 'alfamart' ? 'Alfamart'
                                                                : data.paymentMethod === 'akulaku' ? 'Akulaku'
                                                                    : '—';
        const tableInfo = data.tableCode ? `Meja ${data.tableCode}` : '—';
        const dateStr = new Date(data.createdAt).toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const timeStr = new Date(data.createdAt).toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit',
        });

        const logoUrl = `${window.location.origin}/img/lws-logo.png`;
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
        font-size: 11px;
        width: 72mm;
        padding: 8px 4mm;
        color: #000;
        line-height: 1.35;
    }
    .center { text-align: center; }
    .header { margin-bottom: 6px; }
    .header img { width: 60px; height: auto; margin-bottom: 4px; }
    .header h2 { font-size: 14px; margin-bottom: 1px; letter-spacing: 0.5px; text-transform: uppercase; }
    .header p { font-size: 9px; color: #555; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .info-row { display: flex; justify-content: space-between; font-size: 9px; padding: 1px 0; }
    .info-label { color: #555; }
    .item-row { padding: 3px 0; }
    .item-name { font-weight: bold; font-size: 10px; }
    .item-detail { display: flex; justify-content: space-between; font-size: 9px; padding-left: 4px; }
    .item-option { font-size: 8px; color: #555; padding-left: 10px; display: flex; justify-content: space-between; }
    .item-note { font-size: 8px; color: #888; font-style: italic; padding-left: 10px; }
    .totals { margin-top: 3px; }
    .totals .row { display: flex; justify-content: space-between; padding: 1.5px 0; font-size: 10px; }
    .totals .final { font-weight: bold; font-size: 12px; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px; }
    .payment { text-align: center; margin: 5px 0; font-weight: bold; font-size: 10px; }
    .footer { text-align: center; margin-top: 6px; font-size: 9px; color: #555; }
</style>
</head>
<body>
    <div class="header center">
        <img src="${logoUrl}" alt="LWS Logo" />
        <h2>LW's by Bubur Kang LW</h2>
        <p>Jl. Angkatan 45, Palembang</p>
        <p>Telp: 0813-1234-5678</p>
    </div>
    <div class="divider"></div>
    <div class="info-row">
        <span class="info-label">No. Struk</span>
        <span>${data.orderNumber}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Tanggal</span>
        <span>${dateStr}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Waktu</span>
        <span>${timeStr}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Kasir</span>
        <span>${data.kasir || '—'}</span>
    </div>
    <div class="info-row">
        <span class="info-label">Meja</span>
        <span>${tableInfo}</span>
    </div>
    ${data.customerName ? `
    <div class="info-row">
        <span class="info-label">Pelanggan</span>
        <span>${data.customerName}</span>
    </div>` : ''}
    <div class="divider"></div>
    ${data.receiptItems.map(item => `
    <div class="item-row">
        <div class="item-name">${item.name}</div>
        <div class="item-detail">
            <span>${item.qty} x ${formatPrice(item.basePrice)}</span>
            <span>${formatPrice(item.totalPrice)}</span>
        </div>
        ${item.options.length > 0 ? item.options.map(o => `
        <div class="item-option">
            <span>* ${o.name}</span>
            <span>${o.price > 0 ? '+' + formatPrice(o.price * item.qty) : ''}</span>
        </div>`).join('') : ''}
        ${item.notes ? `<div class="item-note">${item.notes}</div>` : ''}
    </div>`).join('')}
    <div class="divider"></div>
    <div class="totals">
        <div class="row">
            <span>Subtotal</span>
            <span>${formatPrice(data.subtotal)}</span>
        </div>
        <div class="row">
            <span>Service Charge (5%)</span>
            <span>${formatPrice(data.serviceCharge)}</span>
        </div>
        <div class="row">
            <span>Pajak Resto (10%)</span>
            <span>${formatPrice(data.tax)}</span>
        </div>
        ${data.midtransCharge > 0 ? `
        <div class="row">
            <span>Biaya Transaksi Online</span>
            <span>${formatPrice(data.midtransCharge)}</span>
        </div>` : ''}
        ${data.discount > 0 ? `
        <div class="row">
            <span>Diskon${data.discountLabel ? ` (${data.discountLabel})` : ''}</span>
            <span>-${formatPrice(data.discount)}</span>
        </div>` : ''}
        <div class="row final">
            <span>TOTAL</span>
            <span>${formatPrice(data.total)}</span>
        </div>
    </div>
    ${data.paymentMethod === 'cash' && data.cashAmount ? `
    <div class="divider"></div>
    <div class="row">
        <span>Dibayar</span>
        <span>${formatPrice(data.cashAmount)}</span>
    </div>
    <div class="row">
        <span>Kembalian</span>
        <span>${formatPrice(data.change ?? 0)}</span>
    </div>` : ''}
    <div class="divider"></div>
    <div class="payment">
        <span>${paymentLabel}</span>
    </div>
    <div class="divider"></div>
    <div class="footer">
        <p>~ TERIMA KASIH ATAS KUNJUNGAN ANDA ~</p>
        <p style="margin-top:3px;font-size:8px;">Selamat Menikmati Hidangan dari LW's by Bubur Kang LW</p>
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
        tableSelected: isDineIn ? selectedTableIds.length > 0 : true,
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
                        <div className="rounded-xl bg-white p-2 shadow-sm flex" style={{ border: `1px solid ${BORDER}` }}>
                            {(['dine_in', 'takeaway'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => { setOrderType(type); setSelectedTableIds([]); if (type === 'dine_in') setCustomerName(''); }}
                                    className={cn(
                                        'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                        orderType === type ? 'text-white shadow-sm' : 'opacity-70 hover:opacity-100',
                                    )}
                                    style={{
                                        backgroundColor: orderType === type ? PRIMARY : 'transparent',
                                        color: orderType === type ? '#fff' : INK,
                                    }}
                                >
                                    {type === 'dine_in' ? 'Dine-in' : 'Take Away'}
                                </button>
                            ))}
                        </div>
                        {!isDineIn && (
                            <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                                <h2 className="text-base font-semibold" style={{ color: INK }}>Nama Pelanggan</h2>
                                <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Untuk pemanggilan saat pesanan siap</p>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    placeholder="Masukkan nama..."
                                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all focus:ring-1"
                                    style={{ borderColor: BORDER, color: INK, '--tw-ring-color': PRIMARY } as React.CSSProperties}
                                />
                            </div>
                        )}
                        {isDineIn && (
                        <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                            <h2 className="text-base font-semibold" style={{ color: INK }}>Meja</h2>
                            <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Pilih meja</p>
                            {allFloors.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    <button
                                        onClick={() => setSelectedFloor(null)}
                                        className="rounded-lg px-2 py-1 text-[10px] font-medium transition-all"
                                        style={{
                                            backgroundColor: !selectedFloor ? PRIMARY : 'transparent',
                                            color: !selectedFloor ? '#fff' : INK,
                                            opacity: !selectedFloor ? 1 : 0.7,
                                        }}
                                    >
                                        Semua
                                    </button>
                                    {allFloors.map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setSelectedFloor(f)}
                                            className="rounded-lg px-2 py-1 text-[10px] font-medium transition-all"
                                            style={{
                                                backgroundColor: selectedFloor === f ? PRIMARY : 'transparent',
                                                color: selectedFloor === f ? '#fff' : INK,
                                                opacity: selectedFloor === f ? 1 : 0.7,
                                            }}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {filteredTables.map(table => {
                                    const isSelected = selectedTableIds.includes(table.id);
                                    const bgColor = isSelected ? PRIMARY : (TABLE_COLORS[table.status] || '#9ca3af');
                                    const textColor = isSelected || table.status !== 'available' ? '#fff' : INK;
                                    return (
                                        <button
                                            key={table.id}
                                            onClick={() => handleTableClick(table)}
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
                                            {(table.status === 'available' || table.status === 'locked') && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleLock(table); }}
                                                    className="mt-0.5 flex items-center gap-0.5 text-[9px] opacity-70 hover:text-black hover:opacity-100"
                                                    title={table.status === 'locked' ? 'Klik unlock' : 'Klik lock'}
                                                >
                                                    <Lock className="size-2.5" />
                                                    {table.status === 'locked'
                                                        ? (table.locked_by_user?.name ?? 'Terkunci')
                                                        : 'Buka'}
                                                </button>
                                            )}
                                            {getGroupLabel(table.id) && (
                                                <span className="mt-0.5 flex items-center gap-0.5 text-[9px] opacity-80">
                                                    <Link className="size-2.5" />
                                                    {getGroupLabel(table.id)}
                                                </span>
                                            )}
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
                        )}
                    </div>
                </aside>

                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex gap-1 p-2 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {(['dine_in', 'takeaway'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => { setOrderType(type); setSelectedTableIds([]); if (type === 'dine_in') setCustomerName(''); }}
                                className={cn(
                                    'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                    orderType === type ? 'text-white shadow-sm' : 'opacity-70 hover:opacity-100',
                                )}
                                style={{
                                    backgroundColor: orderType === type ? PRIMARY : 'transparent',
                                    color: orderType === type ? '#fff' : INK,
                                }}
                            >
                                {type === 'dine_in' ? 'Dine-in' : 'Take Away'}
                            </button>
                        ))}
                    </div>
                    {!isDineIn && (
                        <div className="p-2 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <input
                                type="text"
                                value={customerName}
                                onChange={e => setCustomerName(e.target.value)}
                                placeholder="Nama pelanggan untuk pemanggilan..."
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all focus:ring-1"
                                style={{ borderColor: BORDER, color: INK, '--tw-ring-color': PRIMARY } as React.CSSProperties}
                            />
                        </div>
                    )}
                    {isDineIn && (
                        <>
                        {allFloors.length > 0 && (
                        <div className="flex gap-1 overflow-x-auto p-2 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}` }}>
                            <button
                                onClick={() => setSelectedFloor(null)}
                                className="flex-shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-all"
                                style={{
                                    backgroundColor: !selectedFloor ? PRIMARY : 'transparent',
                                    color: !selectedFloor ? '#fff' : INK,
                                    opacity: !selectedFloor ? 1 : 0.7,
                                }}
                            >
                                Semua
                            </button>
                            {allFloors.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSelectedFloor(f)}
                                    className="flex-shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-all"
                                    style={{
                                        backgroundColor: selectedFloor === f ? PRIMARY : 'transparent',
                                        color: selectedFloor === f ? '#fff' : INK,
                                        opacity: selectedFloor === f ? 1 : 0.7,
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        )}
                    <div className="flex gap-2 overflow-x-auto p-3 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}` }}>
                        {filteredTables.map(table => {
                            const isSelected = selectedTableIds.includes(table.id);
                            const bgColor = isSelected ? PRIMARY : (TABLE_COLORS[table.status] || '#9ca3af');
                            const textColor = isSelected || table.status !== 'available' ? '#fff' : INK;
                            return (
                                <div key={table.id} className="relative flex flex-col items-center gap-0.5 flex-shrink-0">
                                    <button
                                        onClick={() => handleTableClick(table)}
                                        className="rounded-xl px-4 py-2 text-xs font-medium"
                                        style={{
                                            backgroundColor: bgColor,
                                            color: textColor,
                                            ...(isSelected ? { outline: `2px solid ${SAND}`, outlineOffset: '2px' } : {}),
                                        }}
                                    >
                                        <span>{table.code}</span>
                                        {getGroupLabel(table.id) && (
                                            <span className="ml-1 text-[9px] opacity-80">{getGroupLabel(table.id)}</span>
                                        )}
                                        {isSelected && (
                                            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full" style={{ backgroundColor: SAND, color: INK }}>
                                                <Check className="size-2.5" />
                                            </span>
                                        )}
                                    </button>
                                    {(table.status === 'available' || table.status === 'locked') && (
                                        <button
                                            onClick={() => toggleLock(table)}
                                            className="text-[9px] opacity-70 hover:opacity-100 flex items-center gap-0.5"
                                            title={table.status === 'locked' ? 'Klik unlock' : 'Klik lock'}
                                        >
                                            <Lock className="size-2.5" />
                                            {table.status === 'locked'
                                                ? (table.locked_by_user?.name ?? 'Terkunci')
                                                : 'Buka kunci'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    </>
                    )}

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

                <MidtransPaymentDialog
                    open={midtransDialogOpen}
                    onOpenChange={setMidtransDialogOpen}
                    subtotal={subtotal}
                    total={total}
                    onSuccess={handleMidtransSuccess}
                    getCsrfToken={getCsrfToken}
                    selectedTableId={selectedTableIds[0] ?? null}
                    cartItems={cartItems.map(item => ({
                        menu_id: item.menu.id,
                        qty: item.qty,
                        notes: item.notes || null,
                        option_ids: item.selectedOptions.map(o => o.itemId),
                    }))}
                    discountType={discountType}
                    discountValue={discountValue}
                    discountApprovedBy={discountApprovedBy}
                    orderType={orderType}
                />

                <Dialog open={releaseDialogTable !== null} onOpenChange={(v) => { if (!v) setReleaseDialogTable(null); }}>
                    <DialogContent className="sm:max-w-xs" style={{ backgroundColor: CREAM }}>
                        <div className="flex flex-col items-center py-4 text-center">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-full" style={{ backgroundColor: `${SAND}40` }}>
                                <HandPlatter className="size-7" style={{ color: INK }} />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: INK }}>
                                Meja {releaseDialogTable?.code}
                            </h3>
                            <p className="mt-1 text-sm" style={{ color: MUTED }}>
                                Meja sedang digunakan
                            </p>
                            <div className="mt-5 flex w-full flex-col gap-2">
                                <button
                                    onClick={() => {
                                        if (!releaseDialogTable) return;
                                        const t = releaseDialogTable;
                                        setReleaseDialogTable(null);
                                        setMoveMergeDialog({ mode: 'move', sourceTable: t });
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
                                    style={{ backgroundColor: PRIMARY, color: '#fff' }}
                                >
                                    <Move className="size-4" />
                                    Pindah Meja
                                </button>
                                {(tables.filter(t => t.status === 'occupied' && t.id !== releaseDialogTable?.id).length > 0) && (
                                    <button
                                        onClick={() => {
                                            if (!releaseDialogTable) return;
                                            const t = releaseDialogTable;
                                            setReleaseDialogTable(null);
                                            setMoveMergeDialog({ mode: 'merge', sourceTable: t });
                                        }}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
                                        style={{ backgroundColor: PRIMARY, color: '#fff' }}
                                    >
                                        <ArrowRightLeft className="size-4" />
                                        Gabung Meja
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (!releaseDialogTable) return;
                                        const tableId = releaseDialogTable.id;
                                        setReleaseDialogTable(null);
                                        router.post(`/pos/tables/${tableId}/release`);
                                    }}
                                    className="w-full rounded-xl py-2.5 text-sm font-semibold"
                                    style={{ backgroundColor: PRIMARY, color: '#fff' }}
                                >
                                    Kosongkan Meja
                                </button>
                                <button
                                    onClick={() => setReleaseDialogTable(null)}
                                    className="w-full rounded-xl py-2 text-xs bg-rose-700 text-white hover:bg-rose-800 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <MoveMergeDialog
                    open={moveMergeDialog !== null}
                    mode={moveMergeDialog?.mode ?? null}
                    sourceTable={moveMergeDialog?.sourceTable ?? { id: 0, code: '' }}
                    tables={tables}
                    onClose={() => setMoveMergeDialog(null)}
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

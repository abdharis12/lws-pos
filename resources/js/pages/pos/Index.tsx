import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Search, ShoppingCart, Move, ArrowRightLeft, HandPlatter, Trash2 } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import CartPanel from './components/CartPanel';
import CustomerNameInput from './components/CustomerNameInput';
import MenuCard from './components/MenuCard';
import OrderTypeSelector from './components/OrderTypeSelector';
import PendingOrdersList from './components/PendingOrdersList';
import TableGrid, { MobileTableStrip } from './components/TableGrid';
import ApprovalDialog from './dialogs/ApprovalDialog';
import CashPaymentDialog from './dialogs/CashPaymentDialog';
import ItemDialog from './dialogs/ItemDialog';
import MidtransPaymentDialog from './dialogs/MidtransPaymentDialog';
import MoveMergeDialog from './dialogs/MoveMergeDialog';
import PaymentDialog from './dialogs/PaymentDialog';
import SplitBillDialog from './dialogs/SplitBillDialog';
import SuccessDialog from './dialogs/SuccessDialog';
import { posFetchJson } from './lib/api';
import { orderTypeLabel } from './lib/format';
import { calcSubtotal } from './lib/pricing';
import { printReceipt } from './lib/receipt';
import { ceilTo500, roundingAmount as computeRoundingAmount } from '@/lib/currency';
import type { CartItem, MenuItem, PendingOrder, PosPageProps, PrintReceiptData, TableData } from './types';

const INK = 'oklch(0.48 0.032 195.5)';
const INK_LIGHT = 'oklch(0.48 0.032 195.5 / 0.08)';
const BORDER = 'oklch(0.80 0.038 88.5 / 0.35)';
const CREAM = 'oklch(0.98 0.005 85.0)';
const MUTED = 'oklch(0.60 0.03 88.5)';

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
    const [, setCashAmountGiven] = useState(0);
    const [midtransDialogOpen, setMidtransDialogOpen] = useState(false);
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successType, setSuccessType] = useState<'cash' | 'qris' | 'save'>('cash');
    const [isPendingCashPayment, setIsPendingCashPayment] = useState(false);
    const [successChange, setSuccessChange] = useState(0);
    const printFrameRef = useRef<HTMLIFrameElement>(null);
    const [releaseDialogTable, setReleaseDialogTable] = useState<{ id: number; code: string } | null>(null);
    const [moveMergeDialog, setMoveMergeDialog] = useState<{ mode: 'move' | 'merge'; sourceTable: { id: number; code: string } } | null>(null);
    const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
    const [customerName, setCustomerName] = useState('');
    const [editingProcessing, setEditingProcessing] = useState(false);
    const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<PendingOrder | null>(null);

    const subtotal = useMemo(() => calcSubtotal(cartItems), [cartItems]);
    const tax = useMemo(() => Math.round(subtotal * 0.10), [subtotal]);
    const discountAmount = useMemo(() => {
        if (!discountType || !discountValue) {
            return 0;
        }

        return discountType === 'percentage'
            ? Math.min(subtotal * (discountValue / 100), subtotal)
            : Math.min(discountValue, subtotal);
    }, [subtotal, discountType, discountValue]);
    const rawTotal = Math.max(0, subtotal + tax - discountAmount);
    const roundingAmount = useMemo(() => computeRoundingAmount(rawTotal), [rawTotal]);
    const total = useMemo(() => ceilTo500(rawTotal), [rawTotal]);

    const isDineIn = orderType === 'dine_in';

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
        if (!searchQuery && selectedCategory) {
            return selectedCategory.menus.filter(m => m.is_available);
        }

        const lowered = searchQuery.toLowerCase();

        return allMenus.filter(m => m.is_available && m.name.toLowerCase().includes(lowered));
    }, [searchQuery, selectedCategory, allMenus]);

    function handleAddToCart(menu: MenuItem, qty: number, notes: string, selectedOptions: CartItem['selectedOptions']) {
        setCartItems(prev => {
            const existing = prev.findIndex(item =>
                item.menu.id === menu.id && item.notes === notes &&
                JSON.stringify(item.selectedOptions.map(o => ({ id: o.itemId, qty: o.quantity })).sort((a, b) => a.id - b.id)) ===
                JSON.stringify(selectedOptions.map(o => ({ id: o.itemId, qty: o.quantity })).sort((a, b) => a.id - b.id))
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

    async function handleSubmitApproval() {
        if (!approvalPassword) {
            return;
        }

        setApprovalProcessing(true);
        setApprovalError('');

        const { ok, data } = await posFetchJson<{ message?: string; approved_by?: number }>('/pos/verify-approval', {
            method: 'POST',
            body: JSON.stringify({ password: approvalPassword }),
        });

        setApprovalProcessing(false);

        if (!ok) {
            setApprovalError(data.message || 'Terjadi kesalahan');

            return;
        }

        setDiscountApprovedBy(data.approved_by ?? null);
        setApprovalDialogOpen(false);
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
            prev.includes(table.id) ? prev.filter(id => id !== table.id) : [...prev, table.id]
        );
    }

    async function toggleLock(table: TableData) {
        const isLock = table.status === 'available';
        const { ok, data } = await posFetchJson<{ message?: string }>(
            `/pos/tables/${table.id}/${isLock ? 'lock' : 'unlock'}`,
            { method: 'POST' }
        );

        if (!ok) {
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

        const localServiceCharge = Math.round(subtotal * 0.05);
        const localMidtransCharge = 0;

        return {
            items: [...cartItems],
            discountType, discountValue,
            subtotal,
            tax,
            serviceCharge: localServiceCharge,
            midtransCharge: localMidtransCharge,
            roundingAmount,
            total,
            tableCode: selectedCodes || null,
            kasir: cashierName,
            customerName: pendingOrder?.customer_name ?? customerName,
            cashAmount: cashAmount && cashAmount >= total ? cashAmount : undefined,
            change: change && change >= 0 ? change : undefined,
        };
    }

    function handleOrder(paymentMethod?: string) {
        if (cartItems.length === 0) {
            return;
        }

        if (paymentMethod === 'cash') {
            setCashDialogOpen(true);

            return;
        }

        if (paymentMethod === 'online') {
            setPrintReceiptData(buildReceiptData());
            setMidtransDialogOpen(true);

            return;
        }

        if (isDineIn && selectedTableIds.length === 0) {
            return;
        }

        setData({
            table_id: isDineIn ? selectedTableIds[0] : null,
            table_ids: isDineIn ? selectedTableIds : [],
            items: cartItems.map(item => ({
                menu_id: item.menu.id, qty: item.qty, notes: item.notes || null,
                option_ids: item.selectedOptions.flatMap(o => Array.from({ length: o.quantity }, () => o.itemId)),
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
                resetAfterOrder(); setSuccessType('save'); setSuccessChange(0); setSuccessDialogOpen(true);
            },
        });
    }

    function handleCashConfirm(amountGiven: number) {
        if (cartItems.length === 0 || (isDineIn && selectedTableIds.length === 0)) {
            return;
        }

        setCashAmountGiven(amountGiven);
        setData({
            table_id: isDineIn ? selectedTableIds[0] : null,
            table_ids: isDineIn ? selectedTableIds : [],
            items: cartItems.map(item => ({
                menu_id: item.menu.id, qty: item.qty, notes: item.notes || null,
                option_ids: item.selectedOptions.flatMap(o => Array.from({ length: o.quantity }, () => o.itemId)),
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
                setCashDialogOpen(false); setSuccessType('cash');
                setSuccessChange(amountGiven - total); setSuccessDialogOpen(true); resetAfterOrder();
            },
        });
    }

    function handleMidtransSuccess(result: {
        orderNumber: string;
        paymentType: string;
        subtotal?: number;
        tax?: number;
        serviceCharge?: number;
        midtransCharge: number;
        total?: number;
        roundingAmount?: number;
    }) {
        setPrintReceiptData(prev => ({
            ...(prev ?? buildReceiptData()),
            orderNumber: result.orderNumber,
            paymentMethod: result.paymentType,
            subtotal: result.subtotal ?? prev?.subtotal ?? subtotal,
            tax: result.tax ?? prev?.tax ?? tax,
            serviceCharge: result.serviceCharge ?? prev?.serviceCharge ?? 0,
            midtransCharge: result.midtransCharge,
            total: result.total ?? prev?.total ?? total,
            roundingAmount: 0,
        }));
        resetAfterOrder();
        setMidtransDialogOpen(false);
        setSuccessType('qris');
        setSuccessChange(0);
        setSuccessDialogOpen(true);
    }

    function handleMidtransInitiated(data: {
        order_id: number;
        subtotal: number | string;
        tax: number | string;
        service_charge: number | string;
        midtrans_charge: number | string;
        rounding_amount?: number | string;
        total: number | string;
    }) {
        setPrintReceiptData(prev => ({
            ...(prev ?? buildReceiptData()),
            subtotal: Number(data.subtotal) || prev?.subtotal || subtotal,
            tax: Number(data.tax) || prev?.tax || tax,
            serviceCharge: Number(data.service_charge) || prev?.serviceCharge || 0,
            midtransCharge: Number(data.midtrans_charge) || 0,
            total: Number(data.total) || prev?.total || total,
        }));
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
        setShowPrintButton(false);
        setCashAmountGiven(0);
        setPrintReceiptData(null);

        requestAnimationFrame(() => {
            router.reload({
                only: ['tables', 'activeSessions', 'pendingOrders', 'lastOrder'],
            });
        });
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
                quantity: (o as { quantity?: number }).quantity ?? 1,
            })),
        })));
    }

    function handlePaymentMethodSelect() {
        setPaymentDialogOpen(false);
        setIsPendingCashPayment(true);
        setCashDialogOpen(true);
    }

    function handlePendingCashConfirm(amountGiven: number) {
        if (!selectedPendingOrderId || cartItems.length === 0) {
            return;
        }

        setCashAmountGiven(amountGiven);
        setCashDialogOpen(false);
        setConfirmPayProcessing(true);
        setPrintReceiptData(buildReceiptData(amountGiven));

        router.put(`/pos/orders/${selectedPendingOrderId}/confirm-pay`, {
            items: cartItems.map(item => ({
                menu_id: item.menu.id, qty: item.qty, notes: item.notes || null,
                option_ids: item.selectedOptions.flatMap(o => Array.from({ length: o.quantity }, () => o.itemId)),
            })),
            payment_method: 'cash',
            discount_type: discountValue > 0 ? discountType : null,
            discount_value: discountValue > 0 ? discountValue : null,
            discount_approved_by: discountApprovedBy,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmPayProcessing(false); setIsPendingCashPayment(false);
                resetAfterOrder(); setSuccessType('cash');
                setSuccessChange(amountGiven - total); setSuccessDialogOpen(true);
            },
            onError: () => {
                setConfirmPayProcessing(false); setIsPendingCashPayment(false);
            },
        });
    }

    function handlePrintReceipt() {
        const data = printReceiptData;

        if (!data || data.items.length === 0) {
            return;
        }

        const { items, discountType: dType, discountValue: dVal } = data;
        const order = lastOrder;

        const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

        const sub = num(calcSubtotal(items), 0);
        const tx = num(Math.round(sub * 0.10), 0);
        const sc = num(data.serviceCharge, Math.round(sub * 0.05));
        const mc = num(data.midtransCharge, 0);
        const disc = dType && dVal
            ? (dType === 'percentage' ? Math.min(sub * (dVal / 100), sub) : Math.min(dVal, sub))
            : 0;
        const rawTotal = Math.max(0, sub + tx + sc + mc - disc);
        const roundingAmountValue = num(data.roundingAmount, order ? Number(order.rounding_amount ?? 0) : computeRoundingAmount(rawTotal));
        const totalCalc = ceilTo500(rawTotal);

        const orderNumber = data.orderNumber ?? (order ? `TRX-LW-${order.id}` : null) ?? '—';
        const kasir = data.kasir ?? order?.created_by?.name ?? '';
        const tableCode = data.tableCode ?? order?.table_session?.table?.code ?? null;
        const customerNameVal = data.customerName ?? order?.customer_name ?? null;
        const paymentMethod = data.paymentMethod ?? order?.payment?.method ?? null;
        const ot = orderTypeLabel(order?.order_type);

        const resolvedSubtotal = order ? num(order.subtotal, sub) : num(data.subtotal, sub);
        const resolvedTax = order ? num(order.tax, tx) : num(data.tax, tx);
        const resolvedServiceCharge = order ? num(order.service_charge, sc) : num(data.serviceCharge, sc);
        const resolvedMidtransCharge = order ? num(order.midtrans_charge, mc) : num(data.midtransCharge, mc);
        const resolvedDiscount = order ? num(order.discount, disc) : disc;
        const resolvedTotal = order
            ? num(order.total, totalCalc)
            : num(data.total, totalCalc);

        printReceipt(printFrameRef.current, {
            orderNumber, createdAt: order?.created_at ?? new Date().toISOString(),
            kasir, orderType: ot, tableCode, customerName: customerNameVal,
            receiptItems: order
                ? order.items.map(i => ({
                    name: i.menu.name, qty: i.qty, basePrice: Number(i.base_price),
                    totalPrice: Number(i.total_price),
                    options: i.options.map(o => ({ name: o.option_item.name, price: Number(o.price_adjustment), quantity: o.quantity || 1 })),
                    notes: i.notes,
                }))
                : items.map(i => ({
                    name: i.menu.name, qty: i.qty, basePrice: Number(i.menu.price),
                    totalPrice: (Number(i.menu.price) + i.selectedOptions.reduce((s, o) => s + o.adjustment, 0)) * i.qty,
                    options: i.selectedOptions.map(o => ({ name: o.name, price: o.adjustment, quantity: o.quantity || 1 })),
                    notes: i.notes || null,
                })),
            subtotal: resolvedSubtotal,
            tax: resolvedTax,
            serviceCharge: resolvedServiceCharge,
            midtransCharge: resolvedMidtransCharge,
            discount: resolvedDiscount,
            roundingAmount: roundingAmountValue,
            discountLabel: order?.discount_type === 'percentage' ? `${order.discount_value}%` : dType === 'percentage' ? `${dVal}%` : null,
            total: resolvedTotal,
            paymentMethod, cashAmount: data.cashAmount, change: data.change,
        });
    }

    function handleOrderTypeChange(type: 'dine_in' | 'takeaway') {
        setOrderType(type);
        setSelectedTableIds([]);

        if (type === 'dine_in') {
            setCustomerName('');
        }
    }

    function handleSaveEdits() {
        if (!selectedPendingOrderId || cartItems.length === 0) {
 return; 
}

        setEditingProcessing(true);

        router.put(`/pos/orders/${selectedPendingOrderId}/items`, {
            items: cartItems.map(item => ({
                menu_id: item.menu.id, qty: item.qty, notes: item.notes || null,
                option_ids: item.selectedOptions.flatMap(o => Array.from({ length: o.quantity }, () => o.itemId)),
            })),
        }, {
            preserveScroll: true,
            onSuccess: () => setEditingProcessing(false),
            onError: () => setEditingProcessing(false),
        });
    }

    function handleDeletePendingOrder(order: PendingOrder) {
        setDeleteConfirmOrder(order);
    }

    const cartPanelProps = {
        items: cartItems,
        processing,
        pendingOrderId: selectedPendingOrderId,
        confirmPayProcessing,
        saveProcessing: editingProcessing,
        onSaveEdits: handleSaveEdits,
        tableSelected: isDineIn ? selectedTableIds.length > 0 : true,
        customerName,
        orderType,
        onUpdateQty: (i: number, q: number) => setCartItems(prev => q < 1 ? prev : prev.map((item, idx) => idx === i ? { ...item, qty: q } : item)),
        onRemove: (i: number) => setCartItems(prev => prev.filter((_, idx) => idx !== i)),
        onOrder: handleOrder,
        onConfirmPay: () => setPaymentDialogOpen(true),
        discountType, discountValue, discountApprovedBy,
        onDiscountChange: handleDiscountChange,
        onOpenApproval: () => {
            setApprovalDialogOpen(true); setApprovalPassword(''); setApprovalError('');
        },
        splitCount, onOpenSplitBill: () => setSplitDialogOpen(true),
        onPrintReceipt: handlePrintReceipt, showPrintButton,
    };

    return (
        <>
            <Head title="POS Kasir" />
            <div className="flex h-screen overflow-hidden" style={{ backgroundColor: CREAM }}>

                <aside className="hidden w-80 flex-shrink-0 flex-col overflow-y-auto border-r p-4 lg:flex" style={{ borderColor: BORDER, backgroundColor: '#fff' }}>
                    <div className="flex-1 space-y-4">
                        <PendingOrdersList orders={pendingOrders} selectedId={selectedPendingOrderId} onSelect={handleSelectPendingOrder} onDelete={handleDeletePendingOrder} variant="sidebar" />
                        <OrderTypeSelector orderType={orderType} onChange={handleOrderTypeChange} variant="sidebar" />
                        {!isDineIn && <CustomerNameInput value={customerName} onChange={setCustomerName} variant="sidebar" />}
                        {isDineIn && (
                            <TableGrid
                                tables={tables}
                                selectedTableIds={selectedTableIds}
                                groupedTables={groupedTables ?? null}
                                onTableClick={handleTableClick}
                                onLockToggle={toggleLock}
                            />
                        )}
                    </div>
                </aside>

                <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="border-b px-5 py-3" style={{ borderColor: BORDER, backgroundColor: '#fff' }}>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: MUTED }}>POS Kasir</p>
                            <h2 className="font-serif text-lg font-bold tracking-tight" style={{ color: INK }}>Kasir</h2>
                        </div>
                    </div>

                    <div className="lg:hidden"><OrderTypeSelector orderType={orderType} onChange={handleOrderTypeChange} variant="mobile" /></div>
                    {!isDineIn && <CustomerNameInput value={customerName} onChange={setCustomerName} variant="mobile" />}
                    <MobileTableStrip
                        tables={tables}
                        selectedTableIds={selectedTableIds}
                        groupedTables={groupedTables ?? null}
                        onTableClick={handleTableClick}
                        onLockToggle={toggleLock}
                        isDineIn={isDineIn}
                    />

                    <PendingOrdersList orders={pendingOrders} selectedId={selectedPendingOrderId} onSelect={handleSelectPendingOrder} onDelete={handleDeletePendingOrder} variant="mobile" />

                    <div className="flex gap-1 overflow-x-auto px-5 pt-4 pb-2">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)}
                                className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                                    selectedCategoryId === cat.id
                                        ? 'text-white shadow-sm'
                                        : 'hover:opacity-80'
                                }`}
                                style={{ backgroundColor: selectedCategoryId === cat.id ? INK : 'oklch(0.48 0.032 195.5 / 0.06)', color: selectedCategoryId === cat.id ? '#fff' : INK }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="px-5 py-2">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2" style={{ color: MUTED }} />
                            <Input placeholder="Cari menu..."
                                className="h-10 rounded-xl border-2 bg-white pl-10 shadow-sm transition-all focus:border-emerald-500 focus:ring-emerald-500"
                                style={{ borderColor: BORDER }}
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-10">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {visibleMenus.map(menu => (
                                <MenuCard key={menu.id} menu={menu} onSelect={() => {
                                    setItemDialogMenu(menu); setItemDialogOpen(true);
                                }} />
                            ))}
                            {visibleMenus.length === 0 && (
                                <p className="col-span-full py-8 text-center text-sm" style={{ color: MUTED }}>Menu tidak ditemukan</p>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="hidden w-96 flex-shrink-0 border-l lg:flex lg:flex-col" style={{ borderColor: BORDER, backgroundColor: '#fff' }}>
                    <div className="border-b px-5 py-3" style={{ borderColor: BORDER }}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: MUTED }}>Pesanan</p>
                        <p className="font-serif text-lg font-bold tracking-tight" style={{ color: INK }}>Cart</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <CartPanel {...cartPanelProps} />
                    </div>
                </aside>

                <button onClick={() => setCartOpen(true)}
                    className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-2xl text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 lg:hidden"
                    style={{ backgroundColor: INK }}>
                    <ShoppingCart className="size-6" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">{cartCount}</span>
                    )}
                </button>

                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                    <SheetContent side="bottom" className="h-[85vh]" style={{ backgroundColor: '#fff' }}>
                        <SheetHeader className="border-b px-5 py-4" style={{ borderColor: BORDER }}>
                            <SheetTitle className="font-serif text-lg font-bold" style={{ color: INK }}>Pesanan</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto"><CartPanel {...cartPanelProps} /></div>
                    </SheetContent>
                </Sheet>

                <ItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen} menu={itemDialogMenu} onAdd={handleAddToCart} />
                <PaymentDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} onConfirm={handlePaymentMethodSelect} processing={confirmPayProcessing} />
                <ApprovalDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen} password={approvalPassword} onPasswordChange={setApprovalPassword} onSubmit={handleSubmitApproval} error={approvalError} processing={approvalProcessing} />
                <SplitBillDialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen} splitInputValue={splitInputValue} onSplitInputChange={setSplitInputValue} onApply={(count) => {
                    setSplitCount(Math.max(2, Math.min(20, count))); setSplitDialogOpen(false);
                }} cartItems={cartItems} />
                <CashPaymentDialog open={cashDialogOpen} onOpenChange={v => {
                    setCashDialogOpen(v);

                    if (!v) {
                        setIsPendingCashPayment(false);
                    }
                }} total={total} onConfirm={isPendingCashPayment ? handlePendingCashConfirm : handleCashConfirm} processing={processing} />
                <MidtransPaymentDialog open={midtransDialogOpen} onOpenChange={setMidtransDialogOpen} subtotal={subtotal} total={total} onSuccess={handleMidtransSuccess} onInitiated={handleMidtransInitiated} getCsrfToken={() => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''} selectedTableId={selectedTableIds[0] ?? null} cartItems={cartItems.map(item => ({ menu_id: item.menu.id, qty: item.qty, notes: item.notes || null, option_ids: item.selectedOptions.flatMap(o => Array.from({ length: o.quantity }, () => o.itemId)) }))} discountType={discountType} discountValue={discountValue} discountApprovedBy={discountApprovedBy} orderType={orderType} />

                <Dialog open={releaseDialogTable !== null} onOpenChange={(v) => {
 if (!v) {
setReleaseDialogTable(null);
} 
}}>
                    <DialogContent className="sm:max-w-xs border-0 shadow-lg shadow-slate-900/10" style={{ backgroundColor: '#fff' }}>
                        <div className="flex flex-col items-center py-4 text-center">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl" style={{ backgroundColor: INK_LIGHT }}>
                                <HandPlatter className="size-7" style={{ color: INK }} />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: INK }}>Meja {releaseDialogTable?.code}</h3>
                            <p className="mt-1 text-sm" style={{ color: MUTED }}>Meja sedang digunakan</p>
                            <div className="mt-5 flex w-full flex-col gap-2">
                                <button onClick={() => {
                                    const t = releaseDialogTable; setReleaseDialogTable(null);

                                    if (t) {
setMoveMergeDialog({ mode: 'move', sourceTable: t });
}
                                }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                                    style={{ backgroundColor: INK }}>
                                    <Move className="size-4" /> Pindah Meja
                                </button>
                                {(tables.filter(t => t.status === 'occupied' && t.id !== releaseDialogTable?.id).length > 0) && (
                                    <button onClick={() => {
                                        const t = releaseDialogTable; setReleaseDialogTable(null);

                                        if (t) {
setMoveMergeDialog({ mode: 'merge', sourceTable: t });
}
                                    }}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                                        style={{ backgroundColor: INK }}>
                                        <ArrowRightLeft className="size-4" /> Gabung Meja
                                    </button>
                                )}
                                <button onClick={() => {
 if (!releaseDialogTable) {
return;
}

 router.post(`/pos/tables/${releaseDialogTable.id}/release`); 
}}
                                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                                    style={{ backgroundColor: INK }}>
                                    Kosongkan Meja
                                </button>
                                <button onClick={() => setReleaseDialogTable(null)}
                                    className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-70"
                                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                    Batal
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <MoveMergeDialog open={moveMergeDialog !== null} mode={moveMergeDialog?.mode ?? null} sourceTable={moveMergeDialog?.sourceTable ?? { id: 0, code: '' }} tables={tables} onClose={() => setMoveMergeDialog(null)} />

                <Dialog open={deleteConfirmOrder !== null} onOpenChange={(v) => {
 if (!v) {
setDeleteConfirmOrder(null);
} 
}}>
                    <DialogContent className="sm:max-w-xs border-0 shadow-lg shadow-slate-900/10" style={{ backgroundColor: '#fff' }}>
                        <div className="flex flex-col items-center py-4 text-center">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl" style={{ backgroundColor: '#fef2f2' }}>
                                <Trash2 className="size-7 text-rose-500" />
                            </div>
                            <h3 className="text-lg font-bold" style={{ color: INK }}>Hapus Pesanan</h3>
                            <p className="mt-1 text-sm" style={{ color: MUTED }}>
                                Yakin ingin menghapus pesanan{deleteConfirmOrder?.table_session?.table?.code ? ` meja ${deleteConfirmOrder.table_session.table.code}` : ''}?
                            </p>
                            <div className="mt-5 flex w-full flex-col gap-2">
                                <button onClick={() => {
                                    const order = deleteConfirmOrder; setDeleteConfirmOrder(null);

                                    if (order) {
router.delete(`/pos/orders/${order.id}`, { preserveScroll: true });
}
                                }}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                                    style={{ backgroundColor: '#e11d48' }}>
                                    <Trash2 className="size-4" /> Ya, Hapus
                                </button>
                                <button onClick={() => setDeleteConfirmOrder(null)}
                                    className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-70"
                                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                    Batal
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <SuccessDialog open={successDialogOpen} onClose={handleSuccessClose} onPrint={handlePrintReceipt} type={successType} changeAmount={successChange} />
            </div>

            <iframe ref={printFrameRef} style={{ position: 'absolute', width: 0, height: 0, border: 'none' }} title="print-frame" />
        </>
    );
}

PosIndex.layout = null;

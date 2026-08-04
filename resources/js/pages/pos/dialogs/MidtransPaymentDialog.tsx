import {
    QrCode, Smartphone, Building2, Store, ChevronLeft,
    LoaderCircle, AlertCircle, Check, Copy, ExternalLink,
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';

interface MidtransResponse {
    order_id: number;
    order_number: string;
    subtotal: number | string;
    tax: number | string;
    service_charge: number | string;
    midtrans_charge: number | string;
    rounding_amount?: number | string;
    total: number | string;
    payment_type: string;
    transaction_id: string | null;
    qr_code?: string;
    deeplink_url?: string;
    va_number?: string;
    bank?: string;
    bill_key?: string;
    biller_code?: string;
    payment_code?: string;
    store?: string;
}

export interface MidtransPaymentResult {
    orderId: number;
    orderNumber: string;
    subtotal: number;
    tax: number;
    serviceCharge: number;
    midtransCharge: number;
    total: number;
    roundingAmount?: number;
    paymentType: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subtotal: number;
    total: number;
    onSuccess: (result: MidtransPaymentResult) => void;
    onInitiated?: (data: MidtransResponse) => void;
    getCsrfToken: () => string;
    selectedTableId: number | null;
    cartItems: {
        menu_id: number;
        qty: number;
        notes: string | null;
        option_ids: number[];
    }[];
    discountType: string | null;
    discountValue: number;
    discountApprovedBy: number | null;
    orderType: 'dine_in' | 'takeaway';
}

interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    category: 'qris' | 'ewallet' | 'va' | 'cstore' | 'other';
}

const PAYMENT_METHODS: PaymentMethod[] = [
    { id: 'qris', name: 'QRIS', description: 'GoPay / OVO / LinkAja', category: 'qris' },
    { id: 'gopay', name: 'GoPay', description: 'Dompet digital Gojek', category: 'ewallet' },
    { id: 'shopeepay', name: 'ShopeePay', description: 'Dompet digital Shopee', category: 'ewallet' },
    { id: 'bca_va', name: 'BCA VA', description: 'Transfer ke BCA', category: 'va' },
    { id: 'mandiri_va', name: 'Mandiri VA', description: 'Transfer ke Mandiri', category: 'va' },
    { id: 'bni_va', name: 'BNI VA', description: 'Transfer ke BNI', category: 'va' },
    { id: 'bri_va', name: 'BRI VA', description: 'Transfer ke BRI', category: 'va' },
    { id: 'permata_va', name: 'Permata VA', description: 'Transfer ke Permata', category: 'va' },
    { id: 'echannel', name: 'Mandiri Bill', description: 'Pembayaran Mandiri', category: 'va' },
    { id: 'indomaret', name: 'Indomaret', description: 'Bayar di Indomaret', category: 'cstore' },
    { id: 'alfamart', name: 'Alfamart', description: 'Bayar di Alfamart', category: 'cstore' },
];

const CATEGORY_NAMES: Record<string, string> = {
    qris: 'QRIS',
    ewallet: 'E-Wallet',
    va: 'Virtual Account',
    cstore: 'Convenience Store',
};

export default function MidtransPaymentDialog({
    open, onOpenChange, subtotal, total, onSuccess, onInitiated, getCsrfToken,
    selectedTableId, cartItems, discountType, discountValue, discountApprovedBy, orderType,
}: Props) {
    const [step, setStep] = useState<'select' | 'pay'>('select');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [initLoading, setInitLoading] = useState(false);
    const [polling, setPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<MidtransResponse | null>(null);
    const responseRef = useRef<MidtransResponse | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'settlement' | 'failed'>('pending');
    const [copied, setCopied] = useState(false);
    const orderIdRef = useRef<number | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const localBreakdown = useMemo(() => {
        const sub = subtotal;
        const tx = Math.round(sub * 0.10);
        const sc = Math.round(sub * 0.05);
        const discountAmount = discountType === 'percentage' && discountValue > 0
            ? Math.min(sub * (discountValue / 100), sub)
            : discountType === 'nominal' && discountValue > 0
                ? Math.min(discountValue, sub)
                : 0;
        const rawBeforeCharge = sub + tx + sc - discountAmount;
        const mc = Math.round(rawBeforeCharge * 2.5 / 100 / 100) * 100;
        const finalTotal = rawBeforeCharge + mc;

        return { subtotal: sub, tax: tx, serviceCharge: sc, midtransCharge: mc, roundingAmount: 0, total: finalTotal };
    }, [subtotal, discountType, discountValue]);

    const groupedMethods = useMemo(() => {
        const groups: Record<string, PaymentMethod[]> = {};

        for (const method of PAYMENT_METHODS) {
            if (!groups[method.category]) {
                groups[method.category] = [];
            }

            groups[method.category].push(method);
        }

        return groups;
    }, []);

    useEffect(() => {
        if (!open) {
            resetState();
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, []);

    function resetState() {
        setStep('select');
        setSelectedMethod(null);
        setInitLoading(false);
        setPolling(false);
        setError(null);
        setResponse(null);
        responseRef.current = null;
        setPaymentStatus('pending');
        setCopied(false);
        orderIdRef.current = null;

        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }

    function handleSelectMethod(method: PaymentMethod) {
        if (initLoading || polling) {
            return;
        }

        setSelectedMethod(method);
        setStep('pay');
        setInitLoading(true);
        setError(null);
        setPaymentStatus('pending');

        fetch('/pos/orders/initiate-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': getCsrfToken() },
            body: JSON.stringify({
                table_id: selectedTableId,
                payment_type: method.id,
                order_type: orderType,
                items: cartItems,
                discount_type: discountValue > 0 ? discountType : null,
                discount_value: discountValue > 0 ? discountValue : null,
                discount_approved_by: discountApprovedBy,
            }),
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                setInitLoading(false);

                if (!ok) {
                    setError(data.message || `Gagal memproses ${method.name}`);

                    return;
                }

                setResponse(data);
                responseRef.current = data;
                orderIdRef.current = data.order_id;
                onInitiated?.(data);
            })
            .catch(() => {
                setInitLoading(false);
                setError('Terjadi kesalahan jaringan');
            });
    }

    function startPolling() {
        if (pollRef.current) {
            return;
        }

        setPolling(true);
        setError(null);

        pollRef.current = setInterval(() => {
            handlePoll();
        }, 3000);

        handlePoll();
    }

    function handlePoll() {
        const id = orderIdRef.current;

        if (!id) {
            return;
        }

        fetch(`/pos/orders/${id}/qris-status`, {
            headers: { 'Accept': 'application/json' },
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'settlement') {
                    setPaymentStatus('settlement');

                    if (pollRef.current) {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                    }

                    const resp = responseRef.current;

                    setTimeout(() => {
                        onSuccess({
                            orderId: orderIdRef.current!,
                            orderNumber: resp?.order_number ?? `TRX-LW-${orderIdRef.current}`,
                            subtotal: Number(resp?.subtotal ?? subtotal),
                            tax: Number(resp?.tax ?? 0),
                            serviceCharge: Number(resp?.service_charge ?? 0),
                            total: Number(resp?.total ?? total),
                            midtransCharge: Number(resp?.midtrans_charge ?? 0),
                            roundingAmount: Number(resp?.rounding_amount ?? 0),
                            paymentType: selectedMethod?.id ?? 'qris',
                        });
                    }, 1200);
                } else if (data.status === 'failed') {
                    setPaymentStatus('failed');

                    if (pollRef.current) {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                    }
                }
            })
            .catch(() => {});
    }

    function handleConfirmPayment() {
        // kept for backward-compat no-op (polling is automatic)
    }

    useEffect(() => {
        if (open && step === 'pay' && response && !pollRef.current) {
            startPolling();
        }
    }, [open, step, response]);

    function handleBack() {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }

        setStep('select');
        setSelectedMethod(null);
        setError(null);
        setResponse(null);
        responseRef.current = null;
        setPaymentStatus('pending');
        setCopied(false);
        setInitLoading(false);
        setPolling(false);
    }

    function handleClose() {
        if (paymentStatus === 'settlement') {
            onOpenChange(false);
        } else {
            resetState();
            onOpenChange(false);
        }
    }

    function handleCopy(text: string) {
        if (!navigator.clipboard?.writeText) {
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function formatPrice(amount: number | string | undefined): string {
        const num = typeof amount === 'string' ? Number(amount) : amount;
        const safe = Number.isFinite(num) ? Number(num) : 0;

        return `Rp ${Math.round(safe).toLocaleString('id-ID')}`;
    }

    function getIcon(method: PaymentMethod) {
        if (method.category === 'qris') {
            return QrCode;
        }

        if (method.category === 'ewallet') {
            return Smartphone;
        }

        if (method.category === 'cstore') {
            return Store;
        }

        return Building2;
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: CREAM }}>
                <DialogHeader>
                    <DialogTitle style={{ color: INK }}>
                        {step === 'select' && 'Pilih Metode Pembayaran'}
                        {step === 'pay' && (
                            selectedMethod
                                ? `Bayar dengan ${selectedMethod.name}`
                                : 'Bayar'
                        )}
                    </DialogTitle>
                </DialogHeader>

                {step === 'select' && (
                    <div className="space-y-4">
                        {Object.entries(groupedMethods).map(([category, methods]) => (
                            <div key={category}>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>
                                    {CATEGORY_NAMES[category]}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {methods.map(method => {
                                        const Icon = getIcon(method);

                                        return (
                                            <button
                                                key={method.id}
                                                onClick={() => handleSelectMethod(method)}
                                                disabled={initLoading}
                                                className="flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:opacity-80 disabled:opacity-50"
                                                style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }}
                                            >
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${PRIMARY}10` }}>
                                                    <Icon className="size-5" style={{ color: PRIMARY }} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium" style={{ color: INK }}>{method.name}</p>
                                                    <p className="truncate text-xs" style={{ color: MUTED }}>{method.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {step === 'pay' && (
                    <div className="flex flex-col items-center space-y-4 py-2">
                        <div className="w-full max-w-sm space-y-4">
                            <div className="rounded-xl p-3" style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }}>
                                <p className="mb-2 text-xs font-semibold" style={{ color: MUTED }}>Rincian Pembayaran</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span style={{ color: MUTED }}>Subtotal</span>
                                        <span style={{ color: INK }}>{formatPrice(response?.subtotal ?? subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: MUTED }}>Pajak Resto (10%)</span>
                                        <span style={{ color: INK }}>{formatPrice(response?.tax ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: MUTED }}>Service Charge (5%)</span>
                                        <span style={{ color: INK }}>{formatPrice(response?.service_charge ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span style={{ color: MUTED }}>Biaya Transaksi</span>
                                        <span style={{ color: INK }}>{formatPrice(response?.midtrans_charge ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1.5 font-bold" style={{ borderColor: BORDER, color: PRIMARY }}>
                                        <span>Total</span>
                                        <span>{formatPrice(response?.total ?? total)}</span>
                                    </div>
                                </div>
                            </div>

                            {initLoading && !response && (
                                <div className="flex flex-col items-center gap-3 py-8">
                                    <LoaderCircle className="size-10 animate-spin" style={{ color: PRIMARY }} />
                                    <p className="text-sm" style={{ color: MUTED }}>Membuat pembayaran...</p>
                                </div>
                            )}

                            {error && (
                                <div className="flex flex-col items-center gap-3 py-4">
                                    <AlertCircle className="size-12 text-amber-500" />
                                    <p className="text-sm text-center break-words" style={{ color: MUTED }}>{error}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={handleBack} variant="outline">
                                            Pilih Metode Lain
                                        </Button>
                                        <Button onClick={handleClose} variant="outline">
                                            Tutup
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {response && !initLoading && !error && (
                                <>
                                    <div className="text-center">
                                        <p className="text-xs" style={{ color: MUTED }}>Order ID</p>
                                        <p className="font-mono text-sm font-bold" style={{ color: INK }}>{response.order_number}</p>
                                    </div>

                                    <div className="flex w-full flex-col items-center gap-3">
                                        {response.qr_code && (
                                            <>
                                                <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                                                    <img src={response.qr_code} alt="QR Code" className="size-48 object-contain" />
                                                </div>
                                                <p className="text-xs text-center" style={{ color: MUTED }}>
                                                    Scan QR code di atas menggunakan<br />{selectedMethod?.name === 'QRIS' ? 'GoPay, OVO, atau LinkAja' : `aplikasi ${selectedMethod?.name}`}
                                                </p>
                                            </>
                                        )}

                                        {response.va_number && (
                                            <div className="w-full rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                                                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>
                                                    {response.bank?.toUpperCase()} Virtual Account
                                                </p>
                                                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg p-3" style={{ backgroundColor: `${CREAM}80` }}>
                                                    <span className="font-mono text-lg font-bold tracking-wider break-all" style={{ color: INK }}>
                                                        {response.va_number}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(response.va_number!)}
                                                        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-80"
                                                        style={{ backgroundColor: `${PRIMARY}10`, color: PRIMARY }}
                                                    >
                                                        <Copy className="size-3" />
                                                        {copied ? 'Tersalin' : 'Salin'}
                                                    </button>
                                                </div>
                                                <p className="mt-2 text-xs text-center" style={{ color: MUTED }}>
                                                    Transfer ke nomor Virtual Account di atas melalui {response.bank?.toUpperCase()}
                                                </p>
                                            </div>
                                        )}

                                        {response.bill_key && (
                                            <div className="w-full rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                                                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>
                                                    Mandiri Bill Payment
                                                </p>
                                                <div className="mt-2 space-y-2">
                                                    <div>
                                                        <p className="text-xs" style={{ color: MUTED }}>Bill Key</p>
                                                        <div className="flex items-center gap-2 rounded-lg p-3" style={{ backgroundColor: `${CREAM}80` }}>
                                                            <span className="font-mono text-lg font-bold tracking-wider break-all" style={{ color: INK }}>
                                                                {response.bill_key}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(response.bill_key!)}
                                                                className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-80"
                                                                style={{ backgroundColor: `${PRIMARY}10`, color: PRIMARY }}
                                                            >
                                                                <Copy className="size-3" />
                                                                {copied ? 'Tersalin' : 'Salin'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {response.biller_code && (
                                                        <div>
                                                            <p className="text-xs" style={{ color: MUTED }}>Biller Code</p>
                                                            <p className="font-mono text-sm font-bold" style={{ color: INK }}>{response.biller_code}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs text-center" style={{ color: MUTED }}>
                                                    Bayar melalui ATM Mandiri atau M-Banking
                                                </p>
                                            </div>
                                        )}

                                        {response.payment_code && (
                                            <div className="w-full rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                                                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MUTED }}>
                                                    {response.store ?? 'Pembayaran'} Kode
                                                </p>
                                                <div className="mt-2 flex items-center justify-between gap-2 rounded-lg p-3" style={{ backgroundColor: `${CREAM}80` }}>
                                                    <span className="font-mono text-lg font-bold tracking-wider break-all" style={{ color: INK }}>
                                                        {response.payment_code}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(response.payment_code!)}
                                                        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-80"
                                                        style={{ backgroundColor: `${PRIMARY}10`, color: PRIMARY }}
                                                    >
                                                        <Copy className="size-3" />
                                                        {copied ? 'Tersalin' : 'Salin'}
                                                    </button>
                                                </div>
                                                <p className="mt-2 text-xs text-center" style={{ color: MUTED }}>
                                                    Tunjukkan kode ini ke kasir {response.store}
                                                </p>
                                            </div>
                                        )}

                                        {response.deeplink_url && (
                                            <a
                                                href={response.deeplink_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                                                style={{ backgroundColor: PRIMARY, color: '#fff' }}
                                            >
                                                <ExternalLink className="size-4" />
                                                Buka Aplikasi {selectedMethod?.name}
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-2 rounded-lg p-2 text-xs" style={{ color: MUTED }}>
                                        {paymentStatus === 'pending' && polling && (
                                            <>
                                                <LoaderCircle className="size-3 animate-spin" />
                                                <span>Memverifikasi pembayaran otomatis...</span>
                                            </>
                                        )}
                                        {paymentStatus === 'failed' && (
                                            <span className="text-red-500">Pembayaran gagal — coba lagi.</span>
                                        )}
                                    </div>

                                    <Button onClick={handleBack} variant="outline" className="w-full">
                                        <ChevronLeft className="mr-1 size-4" /> Ganti Metode
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
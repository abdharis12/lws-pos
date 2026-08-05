import { Check, AlertCircle, ChevronLeft, LoaderCircle, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fmt } from '@/lib/currency'
import type { MidtransResponse, PaymentStatus } from '@/types/self-order'

interface Props {
    payStatus: PaymentStatus
    payProcessing: boolean
    payError: string | null
    midtransResponse: MidtransResponse | null
    copied: boolean
    onCopy: (v: boolean) => void
    onBack: () => void
    onRetry: () => void
    onCancel: () => void
}

function CopyButton({ text, copied, onCopy }: { text: string; copied: boolean; onCopy: (v: boolean) => void }) {
    return (
        <button
            onClick={() => {
                if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text).then(() => {
                        onCopy(true)
                        setTimeout(() => onCopy(false), 2000)
                    })
                }
            }}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors hover:opacity-80"
            style={{ backgroundColor: '#4F6B6A10', color: '#4F6B6A' }}
        >
            <Copy className="size-3" />
            {copied ? 'Tersalin' : 'Salin'}
        </button>
    )
}

export function PaymentStatusModal({
    payStatus,
    payProcessing,
    payError,
    midtransResponse,
    copied,
    onCopy,
    onBack,
    onRetry,
    onCancel,
}: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
            <div className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white sm:mb-4 sm:rounded-3xl">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#CFC0A4] sm:hidden" />
                <div className="flex items-center justify-between border-b border-[#F6F2E9] px-6 pb-4 pt-4">
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-[#CFC0A4]/40"
                        onClick={onBack}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">Pembayaran</h2>
                    <div className="w-8" />
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                    {payError && (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <AlertCircle className="size-12 text-amber-500" />
                            <p className="text-sm text-center text-gray-500">{payError}</p>
                            <Button
                                onClick={onRetry}
                                variant="outline"
                                className="rounded-xl"
                                style={{ borderColor: '#CFC0A4', color: '#4F6B6A' }}
                            >
                                Pilih Metode Lain
                            </Button>
                        </div>
                    )}

                    {payProcessing && !payError && (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <LoaderCircle className="size-10 animate-spin" style={{ color: '#4F6B6A' }} />
                            <p className="text-sm text-gray-500">Memproses pembayaran...</p>
                        </div>
                    )}

                    {payStatus === 'settlement' && (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <div className="flex size-16 items-center justify-center rounded-full" style={{ backgroundColor: '#4F6B6A12' }}>
                                <Check className="size-8" style={{ color: '#4F6B6A' }} />
                            </div>
                            <p className="font-semibold text-gray-900">Pembayaran Berhasil</p>
                        </div>
                    )}

                    {payStatus === 'failed' && (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <AlertCircle className="size-12 text-red-500" />
                            <p className="font-semibold text-red-500">Pembayaran Gagal</p>
                            <Button
                                onClick={onRetry}
                                variant="outline"
                                className="rounded-xl"
                                style={{ borderColor: '#CFC0A4', color: '#4F6B6A' }}
                            >
                                Coba Lagi
                            </Button>
                        </div>
                    )}

                    {payStatus === 'pending' && !payProcessing && !payError && midtransResponse && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-full rounded-xl bg-white p-3 shadow-sm" style={{ border: '1px solid #CFC0A4' }}>
                                <p className="mb-2 text-xs font-semibold text-gray-500">Rincian Pembayaran</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-900">{fmt(midtransResponse.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Pajak Resto (10%)</span>
                                        <span className="text-gray-900">{fmt(midtransResponse.tax)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Service Charge (5%)</span>
                                        <span className="text-gray-900">{fmt(midtransResponse.service_charge)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Biaya Transaksi</span>
                                        <span className="text-gray-900">{fmt(midtransResponse.midtrans_charge)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1.5 font-bold" style={{ borderColor: '#CFC0A4', color: '#4F6B6A' }}>
                                        <span>Total</span>
                                        <span>{fmt(midtransResponse.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {midtransResponse.order_number && (
                                <div className="text-center">
                                    <p className="text-xs text-gray-500">Order ID</p>
                                    <p className="font-mono text-sm font-bold text-gray-900">{midtransResponse.order_number}</p>
                                </div>
                            )}

                            {midtransResponse.qr_code && (
                                <>
                                    <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: '1px solid #CFC0A4' }}>
                                        <img src={midtransResponse.qr_code} alt="QR Code" className="size-48 object-contain" />
                                    </div>
                                    <p className="text-xs text-center text-gray-500">
                                        Scan QR code di atas menggunakan GoPay, OVO, atau LinkAja
                                    </p>
                                </>
                            )}

                            {midtransResponse.va_number && (
                                <div className="w-full rounded-xl bg-white p-4 shadow-sm" style={{ border: '1px solid #CFC0A4' }}>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {midtransResponse.bank?.toUpperCase()} Virtual Account
                                    </p>
                                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg p-3" style={{ backgroundColor: '#F6F2E980' }}>
                                        <span className="font-mono text-lg font-bold tracking-wider text-gray-900">
                                            {midtransResponse.va_number}
                                        </span>
                                        <CopyButton text={midtransResponse.va_number} copied={copied} onCopy={onCopy} />
                                    </div>
                                    <p className="mt-2 text-xs text-center text-gray-500">
                                        Transfer ke nomor Virtual Account di atas melalui {midtransResponse.bank?.toUpperCase()}
                                    </p>
                                </div>
                            )}

                            {midtransResponse.bill_key && (
                                <div className="w-full rounded-xl bg-white p-4 shadow-sm" style={{ border: '1px solid #CFC0A4' }}>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Mandiri Bill Payment</p>
                                    <div className="mt-2 space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Bill Key</p>
                                            <div className="flex items-center gap-2 rounded-lg p-3" style={{ backgroundColor: '#F6F2E980' }}>
                                                <span className="font-mono text-lg font-bold tracking-wider text-gray-900">{midtransResponse.bill_key}</span>
                                                <CopyButton text={midtransResponse.bill_key} copied={copied} onCopy={onCopy} />
                                            </div>
                                        </div>
                                        {midtransResponse.biller_code && (
                                            <div>
                                                <p className="text-xs text-gray-500">Biller Code</p>
                                                <p className="font-mono text-sm font-bold text-gray-900">{midtransResponse.biller_code}</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs text-center text-gray-500">Bayar melalui ATM Mandiri atau M-Banking</p>
                                </div>
                            )}

                            {midtransResponse.payment_code && (
                                <div className="w-full rounded-xl bg-white p-4 shadow-sm" style={{ border: '1px solid #CFC0A4' }}>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {midtransResponse.store ?? 'Pembayaran'} Kode
                                    </p>
                                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg p-3" style={{ backgroundColor: '#F6F2E980' }}>
                                        <span className="font-mono text-lg font-bold tracking-wider text-gray-900">{midtransResponse.payment_code}</span>
                                        <CopyButton text={midtransResponse.payment_code} copied={copied} onCopy={onCopy} />
                                    </div>
                                    <p className="mt-2 text-xs text-center text-gray-500">Tunjukkan kode ini ke kasir {midtransResponse.store}</p>
                                </div>
                            )}

                            {midtransResponse.deeplink_url && (
                                <a
                                    href={midtransResponse.deeplink_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                                    style={{ backgroundColor: '#4F6B6A', color: '#fff' }}
                                >
                                    <ExternalLink className="size-4" />
                                    Buka Aplikasi
                                </a>
                            )}

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <LoaderCircle className="size-3 animate-spin" />
                                <span>Menunggu pembayaran...</span>
                            </div>

                            <Button
                                onClick={onBack}
                                variant="outline"
                                className="w-full rounded-xl"
                                style={{ borderColor: '#CFC0A4', color: '#4F6B6A' }}
                            >
                                Ganti Metode
                            </Button>

                            <Button
                                onClick={onCancel}
                                variant="outline"
                                className="w-full rounded-xl"
                                style={{ borderColor: '#E11D48', color: '#E11D48' }}
                            >
                                Batalkan Pembayaran
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

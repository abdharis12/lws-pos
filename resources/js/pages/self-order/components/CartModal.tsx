import { ShoppingCart, X, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fmt } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/types/self-order'

interface Props {
    cart: CartItem[]
    cartCount: number
    cartSubtotal: number
    cartTax: number
    cartRoundingAmount: number
    cartTotal: number
    onlineServiceCharge: number
    midtransCharge: number
    onlineRoundingAmount: number
    onlineTotal: number
    paymentMethod: 'cash' | 'online' | null
    submitting: boolean
    customerName: string
    onSetPaymentMethod: (method: 'cash' | 'online' | null) => void
    onCheckout: () => void
    onRemoveItem: (index: number) => void
    onClose: () => void
    calcItemTotal: (item: CartItem) => number
}

export function CartModal({
    cart,
    cartCount,
    cartSubtotal,
    cartTax,
    cartRoundingAmount,
    cartTotal,
    onlineServiceCharge,
    midtransCharge,
    onlineRoundingAmount,
    onlineTotal,
    paymentMethod,
    submitting,
    customerName,
    onSetPaymentMethod,
    onCheckout,
    onRemoveItem,
    onClose,
    calcItemTotal,
}: Props) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[85vh] w-full max-w-lg animate-slide-up flex-col rounded-t-3xl bg-white sm:rounded-3xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#CFC0A4] sm:hidden" />

                <div className="flex items-center justify-between rounded-t-3xl border-b border-[#F6F2E9] bg-gradient-to-b from-[#F6F2E9]/60 to-white px-6 pb-4 pt-2 sm:pt-5">
                    <h2 className="text-lg font-bold text-gray-900">Pesanan Kamu</h2>
                    <span className="rounded-full bg-[#4F6B6A]/10 px-2.5 py-1 text-xs font-semibold text-[#4F6B6A]">{cartCount} item</span>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-[#8C8577]">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#CFC0A4]/25">
                                <ShoppingCart className="h-6 w-6 text-[#4F6B6A]" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Keranjang kosong</p>
                            <p className="mt-1 text-xs">Tambahkan menu dari daftar</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group relative rounded-2xl bg-[#F6F2E9]/60 p-4 ring-1 ring-[#CFC0A4]/30 transition-colors hover:bg-[#F6F2E9]"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 pr-6">
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md bg-[#4F6B6A]/10 px-2 py-0.5 text-xs font-semibold text-[#4F6B6A]">
                                                    {item.quantity}x
                                                </span>
                                                <p className="font-semibold text-gray-900">{item.name}</p>
                                            </div>
                                            {item.options.length > 0 && (
                                                <p className="mt-1.5 text-xs text-gray-500">
                                                    {item.options
                                                        .map(o => o.quantity > 1 ? `${o.name} x${o.quantity}` : o.name)
                                                        .join(', ')}
                                                </p>
                                            )}
                                            {item.notes && (
                                                <p className="mt-1 text-xs text-gray-500">Catatan: {item.notes}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <p className="whitespace-nowrap text-sm font-semibold text-gray-800">
                                                {fmt(calcItemTotal(item))}
                                            </p>
                                            <button
                                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                                onClick={() => onRemoveItem(idx)}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="border-t border-[#F6F2E9] bg-white px-6 pb-6 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
                        <div className="mb-3 space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-gray-800">{fmt(cartSubtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Pajak Resto (10%)</span>
                                <span className="text-gray-800">{fmt(cartTax)}</span>
                            </div>
                            {cartRoundingAmount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pembulatan</span>
                                    <span className="text-gray-800">{fmt(cartRoundingAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-[#F6F2E9] pt-1.5 font-bold">
                                <span className="text-gray-900">Total</span>
                                <span className="text-[#4F6B6A]">{fmt(cartTotal)}</span>
                            </div>
                        </div>

                        <div className="mb-3 flex gap-2">
                            <button
                                className={cn(
                                    'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]',
                                    paymentMethod === 'cash'
                                        ? 'bg-[#4F6B6A] text-white shadow-sm'
                                        : 'bg-[#F6F2E9] text-gray-600 ring-1 ring-[#CFC0A4]/40',
                                )}
                                onClick={() => onSetPaymentMethod('cash')}
                            >
                                Bayar di Kasir
                            </button>
                            <button
                                className={cn(
                                    'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98]',
                                    paymentMethod === 'online'
                                        ? 'bg-[#4F6B6A] text-white shadow-sm'
                                        : 'bg-[#F6F2E9] text-gray-600 ring-1 ring-[#CFC0A4]/40',
                                )}
                                onClick={() => onSetPaymentMethod('online')}
                            >
                                Bayar Online
                            </button>
                        </div>

                        {paymentMethod === 'online' && (
                            <div className="mb-3 rounded-xl bg-[#F6F2E9] p-3">
                                <p className="mb-2 text-xs font-semibold text-gray-500">Rincian Biaya Online</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="text-gray-800">{fmt(cartSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Pajak Resto (10%)</span>
                                        <span className="text-gray-800">{fmt(cartTax)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Service Charge (5%)</span>
                                        <span className="text-gray-800">{fmt(onlineServiceCharge)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Biaya Transaksi</span>
                                        <span className="text-gray-800">{fmt(midtransCharge)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-[#CFC0A4]/40 pt-1.5 font-bold">
                                        <span className="text-gray-900">Total Akhir</span>
                                        <span className="text-[#4F6B6A]">{fmt(onlineTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            className="h-12 w-full rounded-2xl bg-[#4F6B6A] text-base font-semibold shadow-lg shadow-[#4F6B6A]/20 transition-all hover:bg-[#3d5554] active:scale-[0.98] disabled:opacity-50"
                            onClick={onCheckout}
                            disabled={submitting || !customerName.trim() || !paymentMethod}
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Mengirim...
                                </span>
                            ) : (
                                `Pesan Sekarang — ${paymentMethod === 'online' ? fmt(onlineTotal) : fmt(cartTotal)}`
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

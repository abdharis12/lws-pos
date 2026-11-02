import { QrCode, X } from 'lucide-react'
import type { PaymentMethod } from '@/types/self-order'

const PAYMENT_METHODS: PaymentMethod[] = [
    { id: 'qris', name: 'QRIS', description: 'Scan menggunakan aplikasi bank / e-wallet', category: 'qris' },
]

interface Props {
    onSelect: (methodId: string) => void
    onClose: () => void
}

export function PaymentSelectModal({ onSelect, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
            <div className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white sm:mb-4 sm:rounded-3xl">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#CFC0A4] sm:hidden" />
                <div className="flex items-center justify-between border-b border-[#F6F2E9] px-6 pb-4 pt-4">
                    <h2 className="text-lg font-bold text-gray-900">Pembayaran QRIS</h2>
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-[#CFC0A4]/40"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                    {PAYMENT_METHODS.map(method => (
                        <button
                            key={method.id}
                            onClick={() => onSelect(method.id)}
                            className="flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:opacity-80"
                            style={{ border: '1px solid #CFC0A4', backgroundColor: '#fff' }}
                        >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#4F6B6A10' }}>
                                <QrCode className="size-5" style={{ color: '#4F6B6A' }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900">{method.name}</p>
                                <p className="truncate text-xs text-gray-500">{method.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

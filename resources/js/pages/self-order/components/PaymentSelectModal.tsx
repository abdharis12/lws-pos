import { QrCode, Smartphone, Store, Building2, X } from 'lucide-react'
import type { PaymentMethod } from '@/types/self-order'

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
]

const CATEGORY_NAMES: Record<string, string> = {
    qris: 'QRIS',
    ewallet: 'E-Wallet',
    va: 'Virtual Account',
    cstore: 'Convenience Store',
}

interface Props {
    onSelect: (methodId: string) => void
    onClose: () => void
}

export function PaymentSelectModal({ onSelect, onClose }: Props) {
    const grouped = Object.entries(
        PAYMENT_METHODS.reduce((acc, m) => {
            if (!acc[m.category]) {
                acc[m.category] = []
            }

            acc[m.category].push(m)

            return acc
        }, {} as Record<string, PaymentMethod[]>)
    )

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
            <div className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white sm:mb-4 sm:rounded-3xl">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#CFC0A4] sm:hidden" />
                <div className="flex items-center justify-between border-b border-[#F6F2E9] px-6 pb-4 pt-4">
                    <h2 className="text-lg font-bold text-gray-900">Pilih Pembayaran Online</h2>
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-[#CFC0A4]/40"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                    {grouped.map(([category, methods]) => (
                        <div key={category} className="mb-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                {CATEGORY_NAMES[category]}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {methods.map(method => {
                                    const Icon = method.category === 'qris' ? QrCode
                                        : method.category === 'ewallet' ? Smartphone
                                            : method.category === 'cstore' ? Store
                                                : Building2

                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => onSelect(method.id)}
                                            className="flex items-center gap-3 rounded-xl p-3 text-left transition-all hover:opacity-80"
                                            style={{ border: '1px solid #CFC0A4', backgroundColor: '#fff' }}
                                        >
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#4F6B6A10' }}>
                                                <Icon className="size-5" style={{ color: '#4F6B6A' }} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900">{method.name}</p>
                                                <p className="truncate text-xs text-gray-500">{method.description}</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/self-order'

interface Props {
    outletName: string
    tableCode: string
    customerName: string
    onCustomerNameChange: (v: string) => void
    categories: Category[]
    activeCategory: number
    onCategoryChange: (id: number) => void
    cartCount: number
    onCartOpen: () => void
}

function Table2({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
    )
}

export function Header({
    outletName,
    tableCode,
    customerName,
    onCustomerNameChange,
    categories,
    activeCategory,
    onCategoryChange,
    cartCount,
    onCartOpen,
}: Props) {
    return (
        <div className="sticky top-0 z-10 bg-[#F6F2E9]/85 px-4 pb-3 md:pt-10 lg:pt-14 backdrop-blur-lg">
            <div className="mx-auto max-w-2xl">
                <div className="flex items-center justify-between pt-10 sm:pt-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F6B6A] to-[#33504F] shadow-sm shadow-[#4F6B6A]/20 sm:h-11 sm:w-11">
                            <img src="/img/lws-logo-pdf.png" alt="Logo" className="h-10 w-10 sm:h-6 sm:w-6" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold leading-tight text-gray-900 sm:text-lg">{outletName}</h1>
                            <div className="flex items-center gap-1.5 text-xs text-[#4F6B6A]">
                                <Table2 className="h-3.5 w-3.5" />
                                <span className="font-medium">Meja {tableCode}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#CFC0A4]/40 transition-all active:scale-95"
                        onClick={onCartOpen}
                    >
                        <ShoppingCart className="h-5 w-5 text-[#4F6B6A]" />
                        {cartCount > 0 && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#4F6B6A] px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-[#F6F2E9]">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="relative mt-3">
                    <svg
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                        type="text"
                        value={customerName}
                        onChange={e => onCustomerNameChange(e.target.value)}
                        placeholder="Nama kamu..."
                        className="w-full rounded-2xl border border-[#CFC0A4] bg-white/90 py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none backdrop-blur-sm transition-all focus:border-[#4F6B6A] focus:ring-2 focus:ring-[#4F6B6A]/20"
                    />
                </div>

                {categories.length > 0 && (
                    <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={cn(
                                    'shrink-0 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition-all',
                                    cat.id === activeCategory
                                        ? 'bg-[#4F6B6A] text-white shadow-sm shadow-[#4F6B6A]/20'
                                        : 'bg-white text-gray-600 ring-1 ring-[#CFC0A4]/50 hover:bg-[#F6F2E9] active:scale-95',
                                )}
                                onClick={() => onCategoryChange(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

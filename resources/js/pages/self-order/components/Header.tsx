import { ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/self-order'

interface Props {
    categories: Category[]
    activeCategory: number
    onCategoryChange: (id: number) => void
    cartCount: number
    onCartOpen: () => void
}

export function Header({ categories, activeCategory, onCategoryChange, cartCount, onCartOpen }: Props) {
    return (
        <div className="sticky top-0 z-10 border-b border-[#CFC0A4]/30 bg-[#F6F2E9]/90 px-4 py-3 backdrop-blur-lg">
            <div className="mx-auto flex max-w-2xl items-center gap-2.5">
                {categories.length > 0 && (
                    <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
                        {categories.map(cat => {
                            const active = cat.id === activeCategory
                            return (
                                <button
                                    key={cat.id}
                                    className={cn(
                                        'font-body flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all',
                                        active
                                            ? 'bg-[#2A4443] text-white shadow-sm shadow-[#2A4443]/25'
                                            : 'bg-white text-[#8C8577] ring-1 ring-[#CFC0A4]/50 hover:bg-white active:scale-95',
                                    )}
                                    onClick={() => onCategoryChange(cat.id)}
                                >
                                    {active && <span className="h-1.5 w-1.5 rounded-full bg-[#D9A441]" />}
                                    {cat.name}
                                </button>
                            )
                        })}
                    </div>
                )}

                <button
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2A4443] shadow-sm transition-all active:scale-95"
                    onClick={onCartOpen}
                >
                    <ShoppingCart className="h-5 w-5 text-white" />
                    {cartCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D9A441] px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-[#F6F2E9]">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>
        </div>
    )
}

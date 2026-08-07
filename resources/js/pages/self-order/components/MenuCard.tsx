import { Flame } from 'lucide-react'
import { fmt } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/types/self-order'

const gradients = [
    { from: '#4F6B6A', to: '#2A4443' },
    { from: '#7C9A93', to: '#4F6B6A' },
    { from: '#CFC0A4', to: '#AD9B78' },
    { from: '#8C9C6E', to: '#5C7047' },
    { from: '#5F7470', to: '#33504F' },
    { from: '#D9A441', to: '#AD7E2C' },
    { from: '#6B5D4A', to: '#4E4334' },
    { from: '#4F6B6A', to: '#CFC0A4' },
]

function getGradient(id: number) {
    return gradients[id % gradients.length]
}

interface Props {
    menu: MenuItem
    onSelect: (menu: MenuItem) => void
    /** Marks the first / hero pick in a category with a "Favorit" ribbon. */
    featured?: boolean
}

export function MenuCard({ menu, onSelect, featured = false }: Props) {
    const g = getGradient(menu.id)

    return (
        <button
            className={cn(
                'group relative w-full overflow-hidden rounded-[22px] bg-white text-left shadow-sm ring-1 ring-black/5 transition-all',
                menu.is_available
                    ? 'hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] active:translate-y-0'
                    : 'opacity-60',
            )}
            onClick={() => menu.is_available && onSelect(menu)}
            disabled={!menu.is_available}
        >
            <div className="relative aspect-square overflow-hidden">
                {menu.photo_path ? (
                    <img
                        src={`/storage/${menu.photo_path}`}
                        alt={menu.name}
                        className={cn(
                            'size-full object-cover transition-transform duration-300 group-hover:scale-105',
                            !menu.is_available && 'grayscale',
                        )}
                    />
                ) : (
                    <div
                        className="flex size-full items-center justify-center font-display text-4xl font-semibold text-white transition-transform duration-300 group-hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                    >
                        {menu.name.charAt(0)}
                    </div>
                )}

                {featured && menu.is_available && (
                    <span className="absolute -left-8 top-3 flex -rotate-45 items-center gap-1 bg-[#D9A441] px-8 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        <Flame className="h-2.5 w-2.5" />
                        Favorit
                    </span>
                )}

                {!menu.is_available && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                        <span className="-rotate-6 rounded-md bg-white px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-[#B84A3E] shadow-sm">
                            Habis
                        </span>
                    </div>
                )}

                <span className="absolute bottom-5 right-3 rounded-full bg-[#2A4443] px-2.5 py-1 font-body text-[11px] font-bold text-white shadow-md">
                    {fmt(menu.price)}
                </span>
            </div>

            <div className="p-3 pt-4">
                <p className="font-body line-clamp-1 text-sm font-semibold text-[#2A2620]">{menu.name}</p>
                {!menu.is_available && (
                    <p className="font-body mt-0.5 text-[11px] text-[#8C8577]">Stok habis untuk hari ini</p>
                )}
            </div>
        </button>
    )
}

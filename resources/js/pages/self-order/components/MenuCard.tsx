import { fmt } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/types/self-order'

const gradients = [
    { from: '#4F6B6A', to: '#33504F' },
    { from: '#7C9A93', to: '#5C7D76' },
    { from: '#CFC0A4', to: '#AD9B78' },
    { from: '#8C9C6E', to: '#6C7C52' },
    { from: '#5F7470', to: '#41524E' },
    { from: '#B4A582', to: '#948561' },
    { from: '#6B5D4A', to: '#4E4334' },
    { from: '#4F6B6A', to: '#CFC0A4' },
]

function getGradient(id: number) {
    return gradients[id % gradients.length]
}

interface Props {
    menu: MenuItem
    onSelect: (menu: MenuItem) => void
}

export function MenuCard({ menu, onSelect }: Props) {
    const g = getGradient(menu.id)

    return (
        <button
            className={cn(
                'group w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-[#CFC0A4]/30 transition-all',
                menu.is_available
                    ? 'hover:-translate-y-0.5 hover:shadow-md hover:ring-[#4F6B6A]/30 active:scale-[0.97] active:translate-y-0'
                    : 'opacity-55',
            )}
            onClick={() => menu.is_available && onSelect(menu)}
            disabled={!menu.is_available}
        >
            <div className="relative flex aspect-square items-center justify-center overflow-hidden">
                {menu.photo_path ? (
                    <img
                        src={`/storage/${menu.photo_path}`}
                        alt={menu.name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div
                        className="flex size-full items-center justify-center text-4xl font-bold text-white transition-transform duration-300 group-hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                    >
                        {menu.name.charAt(0)}
                    </div>
                )}
            </div>
            <div className="space-y-1.5 bg-[#4F6B6A] p-3">
                <p className="line-clamp-1 text-sm font-medium text-white">{menu.name}</p>
                <p className="text-sm font-bold text-white">{fmt(menu.price)}</p>
                {!menu.is_available && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-inset ring-red-600/20">
                        Habis
                    </span>
                )}
            </div>
        </button>
    )
}

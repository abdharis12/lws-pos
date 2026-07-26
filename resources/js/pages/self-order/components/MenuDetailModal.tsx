import { Check, Minus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fmt } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/types/self-order'

interface SelOptions {
    [groupId: number]: Record<number, number>
}

interface Props {
    menu: MenuItem
    qty: number
    notes: string
    selOptions: SelOptions
    onQtyChange: (qty: number) => void
    onNotesChange: (notes: string) => void
    onToggleOption: (groupId: number, itemId: number, type: 'single' | 'multiple') => void
    onChangeOptionQty: (groupId: number, itemId: number, delta: number) => void
    onAddToCart: () => void
    onClose: () => void
    modalTotal: number
}

export function MenuDetailModal({
    menu,
    qty,
    notes,
    selOptions,
    onQtyChange,
    onNotesChange,
    onToggleOption,
    onChangeOptionQty,
    onAddToCart,
    onClose,
    modalTotal,
}: Props) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white sm:mb-4 sm:rounded-3xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#CFC0A4] sm:hidden" />

                <div className="flex items-start justify-between rounded-t-3xl border-b border-[#F6F2E9] bg-gradient-to-b from-[#F6F2E9]/60 to-white px-6 pb-4 pt-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{menu.name}</h2>
                        <p className="mt-1 text-lg font-semibold text-[#4F6B6A]">{fmt(menu.price)}</p>
                    </div>
                    <button
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-[#CFC0A4]/40 transition-colors hover:bg-[#F6F2E9]"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="max-h-[50vh] overflow-y-auto px-6 py-5">
                    {menu.option_groups.map(g => (
                        <div key={g.id} className="mb-6">
                            <div className="mb-3 flex items-center gap-1">
                                <p className="text-sm font-semibold text-gray-700">{g.name}</p>
                                {g.is_required && (
                                    <span className="rounded-md bg-[#4F6B6A]/10 px-1.5 py-0.5 text-[11px] font-medium text-[#4F6B6A] ring-1 ring-inset ring-[#4F6B6A]/20">
                                        Wajib
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2.5">
                                {g.option_items.map(item => {
                                    const selectedQty = selOptions[g.id]?.[item.id] ?? 0
                                    const isSelected = selectedQty > 0

                                    return (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                'rounded-xl border p-4 transition-all',
                                                isSelected
                                                    ? 'border-[#4F6B6A] bg-[#4F6B6A]/5 shadow-sm'
                                                    : 'border-gray-100',
                                            )}
                                        >
                                            <div
                                                className="flex cursor-pointer items-center justify-between"
                                                onClick={() => onToggleOption(g.id, item.id, g.selection_type)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                                                            isSelected
                                                                ? 'scale-110 border-[#4F6B6A] bg-[#4F6B6A]'
                                                                : 'border-gray-300',
                                                            g.selection_type === 'multiple' && 'rounded-md',
                                                        )}
                                                    >
                                                        {isSelected && g.selection_type === 'single' && (
                                                            <div className="h-2 w-2 rounded-full bg-white" />
                                                        )}
                                                        {isSelected && g.selection_type === 'multiple' && (
                                                            <Check className="h-3 w-3 text-white" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-700">{item.name}</span>
                                                </div>
                                                {item.price_adjustment > 0 && (
                                                    <span className="shrink-0 text-xs text-gray-400">
                                                        +{fmt(item.price_adjustment)}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div className="mt-3 flex items-center gap-3 rounded-lg bg-[#F6F2E9] p-1">
                                                    <button
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#4F6B6A] shadow-sm transition-all active:scale-95"
                                                        onClick={e => {
                                                            e.stopPropagation()
                                                            onChangeOptionQty(g.id, item.id, -1)
                                                        }}
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="flex min-w-6 justify-center text-sm font-bold text-gray-900">
                                                        {selectedQty}
                                                    </span>
                                                    <button
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#4F6B6A] shadow-sm transition-all active:scale-95"
                                                        onClick={e => {
                                                            e.stopPropagation()
                                                            onChangeOptionQty(g.id, item.id, 1)
                                                        }}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="mb-5">
                        <p className="mb-2 text-sm font-semibold text-gray-700">Catatan</p>
                        <textarea
                            className="w-full resize-none rounded-xl border border-[#CFC0A4]/50 bg-[#F6F2E9]/40 p-3.5 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#4F6B6A] focus:bg-white focus:ring-2 focus:ring-[#4F6B6A]/20"
                            rows={2}
                            placeholder="Contoh: tidak pedas, pake sambel terpisah"
                            value={notes}
                            onChange={e => onNotesChange(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between border-t border-[#F6F2E9] pt-4">
                        <div className="flex items-center gap-3 rounded-xl bg-[#F6F2E9] p-1">
                            <button
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#4F6B6A] shadow-sm transition-all active:scale-95 disabled:opacity-30"
                                onClick={() => onQtyChange(Math.max(1, qty - 1))}
                                disabled={qty <= 1}
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="flex w-6 justify-center text-base font-bold text-gray-900">{qty}</span>
                            <button
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#4F6B6A] shadow-sm transition-all active:scale-95"
                                onClick={() => onQtyChange(qty + 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                        <Button
                            className="h-11 rounded-xl bg-[#4F6B6A] px-6 text-sm font-semibold shadow-sm transition-all hover:bg-[#3d5554] active:scale-[0.97]"
                            onClick={onAddToCart}
                        >
                            + {fmt(modalTotal)}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

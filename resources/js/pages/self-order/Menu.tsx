import { router, Head } from '@inertiajs/react'
import { Plus, Minus, ShoppingCart, X, Check, Store, User, Clock } from 'lucide-react'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OptionItem {
    id: number
    name: string
    price_adjustment: number
}

interface OptionGroup {
    id: number
    name: string
    selection_type: 'single' | 'multiple'
    is_required: boolean
    option_items: OptionItem[]
}

interface MenuItem {
    id: number
    name: string
    price: number
    is_available: boolean
    option_groups: OptionGroup[]
}

interface Category {
    id: number
    name: string
    menus: MenuItem[]
}

interface CartOption {
    id: number
    name: string
    groupName: string
    priceAdjustment: number
}

interface CartItem {
    menuId: number
    name: string
    basePrice: number
    quantity: number
    notes: string
    options: CartOption[]
}

interface Props {
    table: { code: string }
    tableToken: string
    categories: Category[]
    outlet: { name: string }
}

let _fmt: Intl.NumberFormat

function fmt(price: number) {
    _fmt ??= new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })

    return _fmt.format(price)
}

const gradients: { from: string; to: string }[] = [
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

export default function SelfOrderMenu({
    table,
    tableToken,
    categories,
    outlet,
}: Props) {
    const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 0)
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null)
    const [qty, setQty] = useState(1)
    const [notes, setNotes] = useState('')
    const [selOptions, setSelOptions] = useState<Record<number, number | number[]>>({})
    const [customerName, setCustomerName] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [placed, setPlaced] = useState(false)

    const activeMenus = categories.find(c => c.id === activeCategory)?.menus ?? []
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

    const openMenu = useCallback((menu: MenuItem) => {
        setSelectedMenu(menu)
        setQty(1)
        setNotes('')
        const init: Record<number, number | number[]> = {}

        for (const g of menu.option_groups) {
            init[g.id] = g.selection_type === 'single' ? (g.option_items[0]?.id ?? 0) : []
        }

        setSelOptions(init)
    }, [])

    const closeMenu = useCallback(() => setSelectedMenu(null), [])

    const toggleOption = useCallback(
        (groupId: number, itemId: number, type: 'single' | 'multiple') => {
            setSelOptions(prev => {
                if (type === 'single') {
                    return { ...prev, [groupId]: itemId }
                }

                const cur: number[] = Array.isArray(prev[groupId]) ? (prev[groupId] as number[]) : []
                const next = cur.includes(itemId)
                    ? cur.filter(id => id !== itemId)
                    : [...cur, itemId]

                return { ...prev, [groupId]: next }
            })
        },
        [],
    )

    const calcModalTotal = useCallback((): number => {
        if (!selectedMenu) {
            return 0
        }

        let adj = 0

        for (const g of selectedMenu.option_groups) {
            const sel = selOptions[g.id]

            if (g.selection_type === 'single') {
                const item = g.option_items.find(i => i.id === sel)

                if (item) {
                    adj += item.price_adjustment
                }
            } else {
                for (const id of (sel as number[]) ?? []) {
                    const item = g.option_items.find(i => i.id === id)

                    if (item) {
                        adj += item.price_adjustment
                    }
                }
            }
        }

        return (selectedMenu.price + adj) * qty
    }, [selectedMenu, selOptions, qty])

    const addToCart = useCallback(() => {
        if (!selectedMenu) {
            return
        }

        const options: CartOption[] = []

        for (const g of selectedMenu.option_groups) {
            const sel = selOptions[g.id]

            if (g.selection_type === 'single') {
                const item = g.option_items.find(i => i.id === sel)

                if (item) {
                    options.push({
                        id: item.id,
                        name: item.name,
                        groupName: g.name,
                        priceAdjustment: item.price_adjustment,
                    })
                }
            } else {
                for (const id of (sel as number[]) ?? []) {
                    const item = g.option_items.find(i => i.id === id)

                    if (item) {
                        options.push({
                            id: item.id,
                            name: item.name,
                            groupName: g.name,
                            priceAdjustment: item.price_adjustment,
                        })
                    }
                }
            }
        }

        setCart(prev => [
            ...prev,
            {
                menuId: selectedMenu.id,
                name: selectedMenu.name,
                basePrice: selectedMenu.price,
                quantity: qty,
                notes,
                options,
            },
        ])
        closeMenu()
    }, [selectedMenu, selOptions, qty, notes, closeMenu])

    const removeFromCart = useCallback((index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index))
    }, [])

    const calcItemTotal = useCallback((item: CartItem): number => {
        const adj = item.options.reduce((s, o) => s + o.priceAdjustment, 0)

        return (item.basePrice + adj) * item.quantity
    }, [])

    const calcCartTotal = useCallback((): number => {
        return cart.reduce((s, i) => s + calcItemTotal(i), 0)
    }, [cart, calcItemTotal])

    const submitOrder = useCallback(() => {
        setSubmitting(true)
        router.post(
            `/t/${tableToken}/orders`,
            {
                customer_name: customerName,
                items: cart.map(i => ({
                    menu_id: i.menuId,
                    qty: i.quantity,
                    notes: i.notes,
                    option_ids: i.options.map(o => o.id),
                })),
            },
            {
                onSuccess: () => {
                    setPlaced(true)
                    setCart([])
                    setIsCartOpen(false)
                    setSubmitting(false)
                },
                onError: () => {
                    setSubmitting(false)
                },
            },
        )
    }, [cart, customerName, tableToken])

    if (placed) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#F6F2E9] to-white p-6 text-center">
                <Head title="Pesanan Diterima" />
                <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#4F6B6A] to-[#33504F] shadow-lg shadow-[#4F6B6A]/25 sm:h-28 sm:w-28">
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#4F6B6A]/20" />
                    <Check className="h-12 w-12 text-white sm:h-14 sm:w-14" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    Pesanan Diterima!
                </h1>
                <p className="mt-2 text-sm text-gray-500 sm:text-base">Pesanan kamu sudah diterima oleh dapur.</p>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">Silakan tunggu pesanan disajikan di meja {table.code}.</p>
                <Button
                    className="mt-10 h-12 w-full max-w-[280px] rounded-2xl bg-[#4F6B6A] text-base font-semibold shadow-lg shadow-[#4F6B6A]/20 transition-all hover:bg-[#3d5554] hover:shadow-xl hover:shadow-[#4F6B6A]/30 active:scale-[0.98]"
                    onClick={() => setPlaced(false)}
                >
                    Pesan Lagi
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F6F2E9]">
            <Head title={`Menu - ${outlet.name}`} />

            <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

            <div className="sticky top-0 z-10 bg-[#F6F2E9]/85 px-4 pb-3 pt-safe backdrop-blur-lg">
                <div className="mx-auto max-w-2xl">
                    <div className="flex items-center justify-between pt-3 sm:pt-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F6B6A] to-[#33504F] shadow-sm shadow-[#4F6B6A]/20 sm:h-11 sm:w-11">
                                <Store className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold leading-tight text-gray-900 sm:text-lg">{outlet.name}</h1>
                                <div className="flex items-center gap-1.5 text-xs text-[#4F6B6A]">
                                    <Table2Icon className="h-3.5 w-3.5" />
                                    <span className="font-medium">Meja {table.code}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#CFC0A4]/40 transition-all active:scale-95"
                            onClick={() => setIsCartOpen(true)}
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
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Nama kamu..."
                            className="w-full rounded-2xl border border-[#CFC0A4] bg-white/90 py-3 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none backdrop-blur-sm transition-all focus:border-[#4F6B6A] focus:ring-2 focus:ring-[#4F6B6A]/20"
                            disabled={placed}
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
                                    onClick={() => setActiveCategory(cat.id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-2xl px-4 pb-28">
                {activeMenus.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#8C8577]">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#CFC0A4]/25">
                            <Clock className="h-7 w-7 text-[#4F6B6A]" />
                        </div>
                        <p className="text-sm">Tidak ada menu di kategori ini</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {activeMenus.map(menu => {
                            const g = getGradient(menu.id)

                            return (
                                <button
                                    key={menu.id}
                                    className={cn(
                                        'group w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-[#CFC0A4]/30 transition-all',
                                        menu.is_available
                                            ? 'hover:-translate-y-0.5 hover:shadow-md hover:ring-[#4F6B6A]/30 active:scale-[0.97] active:translate-y-0'
                                            : 'opacity-55',
                                    )}
                                    onClick={() => menu.is_available && openMenu(menu)}
                                    disabled={!menu.is_available}
                                >
                                    <div
                                        className="flex aspect-square items-center justify-center text-4xl font-bold text-white transition-transform duration-300 group-hover:scale-105"
                                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                                    >
                                        {menu.name.charAt(0)}
                                    </div>
                                    <div className="space-y-1.5 p-3">
                                        <p className="line-clamp-1 text-sm font-medium text-gray-800">
                                            {menu.name}
                                        </p>
                                        <p className="text-sm font-semibold text-[#4F6B6A]">
                                            {fmt(menu.price)}
                                        </p>
                                        {!menu.is_available && (
                                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-inset ring-red-600/20">
                                                Habis
                                            </span>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {selectedMenu && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
                    onClick={closeMenu}
                >
                    <div
                        className="w-full max-w-lg animate-slide-up rounded-t-3xl bg-white sm:mb-4 sm:rounded-3xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#CFC0A4] sm:hidden" />

                        <div className="flex items-start justify-between rounded-t-3xl border-b border-[#F6F2E9] bg-gradient-to-b from-[#F6F2E9]/60 to-white px-6 pb-4 pt-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {selectedMenu.name}
                                </h2>
                                <p className="mt-1 text-lg font-semibold text-[#4F6B6A]">
                                    {fmt(selectedMenu.price)}
                                </p>
                            </div>
                            <button
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-[#CFC0A4]/40 transition-colors hover:bg-[#F6F2E9]"
                                onClick={closeMenu}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto px-6 py-5">
                            {selectedMenu.option_groups.map(g => (
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
                                            const isSelected =
                                                g.selection_type === 'single'
                                                    ? selOptions[g.id] === item.id
                                                    : (selOptions[g.id] as number[])?.includes(item.id)

                                            return (
                                                <label
                                                    key={item.id}
                                                    className={cn(
                                                        'flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all',
                                                        isSelected
                                                            ? 'border-[#4F6B6A] bg-[#4F6B6A]/5 shadow-sm'
                                                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50',
                                                    )}
                                                    onClick={() =>
                                                        toggleOption(g.id, item.id, g.selection_type)
                                                    }
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
                                                        <span className="text-sm text-gray-700">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    {item.price_adjustment > 0 && (
                                                        <span className="shrink-0 text-xs text-gray-400">
                                                            +{fmt(item.price_adjustment)}
                                                        </span>
                                                    )}
                                                </label>
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
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-between border-t border-[#F6F2E9] pt-4">
                                <div className="flex items-center gap-3 rounded-xl bg-[#F6F2E9] p-1">
                                    <button
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#4F6B6A] shadow-sm transition-all active:scale-95 disabled:opacity-30"
                                        onClick={() => setQty(prev => Math.max(1, prev - 1))}
                                        disabled={qty <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="flex w-6 justify-center text-base font-bold text-gray-900">
                                        {qty}
                                    </span>
                                    <button
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#4F6B6A] shadow-sm transition-all active:scale-95"
                                        onClick={() => setQty(prev => prev + 1)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <Button
                                    className="h-11 rounded-xl bg-[#4F6B6A] px-6 text-sm font-semibold shadow-sm transition-all hover:bg-[#3d5554] active:scale-[0.97]"
                                    onClick={addToCart}
                                >
                                    + {fmt(calcModalTotal())}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isCartOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
                    onClick={() => setIsCartOpen(false)}
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
                                                        <p className="font-semibold text-gray-900">
                                                            {item.name}
                                                        </p>
                                                    </div>
                                                    {item.options.length > 0 && (
                                                        <p className="mt-1.5 text-xs text-gray-500">
                                                            {item.options
                                                                .map(o => o.name)
                                                                .join(', ')}
                                                        </p>
                                                    )}
                                                    {item.notes && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Catatan: {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <p className="whitespace-nowrap text-sm font-semibold text-gray-800">
                                                        {fmt(calcItemTotal(item))}
                                                    </p>
                                                    <button
                                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                                        onClick={() => removeFromCart(idx)}
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
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-base font-semibold text-gray-800">
                                        Total
                                    </span>
                                    <span className="text-xl font-bold text-[#4F6B6A]">
                                        {fmt(calcCartTotal())}
                                    </span>
                                </div>
                                <Button
                                    className="h-12 w-full rounded-2xl bg-[#4F6B6A] text-base font-semibold shadow-lg shadow-[#4F6B6A]/20 transition-all hover:bg-[#3d5554] active:scale-[0.98] disabled:opacity-50"
                                    onClick={submitOrder}
                                    disabled={submitting || !customerName.trim()}
                                >
                                    {submitting ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Mengirim...
                                        </span>
                                    ) : (
                                        'Pesan Sekarang'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function Table2Icon({ className }: { className?: string }) {
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

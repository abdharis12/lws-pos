import { useState, useCallback } from 'react'
import { router, Head } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Minus, ShoppingCart, X, Check } from 'lucide-react'

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

function fmt(price: number) {
  return `Rp${price.toLocaleString('id-ID')}`
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
        if (type === 'single') return { ...prev, [groupId]: itemId }
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
    if (!selectedMenu) return 0
    let adj = 0
    for (const g of selectedMenu.option_groups) {
      const sel = selOptions[g.id]
      if (g.selection_type === 'single') {
        const item = g.option_items.find(i => i.id === sel)
        if (item) adj += item.price_adjustment
      } else {
        for (const id of (sel as number[]) ?? []) {
          const item = g.option_items.find(i => i.id === id)
          if (item) adj += item.price_adjustment
        }
      }
    }
    return (selectedMenu.price + adj) * qty
  }, [selectedMenu, selOptions, qty])

  const addToCart = useCallback(() => {
    if (!selectedMenu) return
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
  }, [cart, tableToken])

  if (placed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F2E9] p-6 text-center">
        <Head title="Pesanan Diterima" />
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Pesanan Diterima</h1>
        <p className="mb-1 text-gray-600">Pesanan kamu sudah diterima oleh dapur.</p>
        <p className="text-sm text-gray-500">Silakan tunggu pesanan disajikan.</p>
        <Button
          className="mt-8 bg-[#4F6B6A] hover:bg-[#3d5554]"
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
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="sticky top-0 z-10 bg-[#F6F2E9] px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{outlet.name}</h1>
            <p className="text-sm text-gray-500">Meja {table.code}</p>
          </div>
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#4F6B6A] text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="mt-3">
          <input
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Nama kamu..."
            className="w-full rounded-xl border border-[#CFC0A4] bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-[#4F6B6A] focus:ring-1 focus:ring-[#4F6B6A]"
            disabled={placed}
          />
        </div>

        {categories.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  cat.id === activeCategory
                    ? 'bg-[#4F6B6A] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100',
                )}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-24">
        {activeMenus.length === 0 ? (
          <p className="py-12 text-center text-gray-400">Tidak ada menu di kategori ini</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {activeMenus.map(menu => (
              <button
                key={menu.id}
                className={cn(
                  'w-full rounded-xl bg-white text-left shadow-sm transition-all hover:shadow-md',
                  !menu.is_available && 'opacity-50',
                )}
                onClick={() => menu.is_available && openMenu(menu)}
                disabled={!menu.is_available}
              >
                <div className="flex aspect-square items-center justify-center rounded-t-xl bg-[#4F6B6A] text-4xl font-bold text-white">
                  {menu.name.charAt(0)}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800">{menu.name}</p>
                  <p className="mt-1 text-sm font-semibold text-[#4F6B6A]">{fmt(menu.price)}</p>
                  {!menu.is_available && (
                    <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      Habis
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in"
          onClick={closeMenu}
        >
          <div
            className="w-full max-w-lg animate-slide-up rounded-t-2xl bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selectedMenu.name}</h2>
                <p className="mt-1 text-lg font-semibold text-[#4F6B6A]">
                  {fmt(selectedMenu.price)}
                </p>
              </div>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100"
                onClick={closeMenu}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-5">
              {selectedMenu.option_groups.map(g => (
                <div key={g.id} className="mb-5">
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    {g.name}
                    {g.is_required && <span className="ml-1 text-red-500">*</span>}
                  </p>
                  <div className="space-y-2">
                    {g.option_items.map(item => {
                      const isSelected =
                        g.selection_type === 'single'
                          ? selOptions[g.id] === item.id
                          : (selOptions[g.id] as number[])?.includes(item.id)
                      return (
                        <label
                          key={item.id}
                          className={cn(
                            'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors',
                            isSelected
                              ? 'border-[#4F6B6A] bg-[#4F6B6A]/5'
                              : 'border-gray-200',
                          )}
                          onClick={() =>
                            toggleOption(g.id, item.id, g.selection_type)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-5 w-5 items-center justify-center rounded-full border-2',
                                isSelected
                                  ? 'border-[#4F6B6A] bg-[#4F6B6A]'
                                  : 'border-gray-300',
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
                            <span className="text-xs text-gray-500">
                              +{fmt(item.price_adjustment)}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}

              {selectedMenu.option_groups.filter(g => g.is_required).length > 0 && (
                <p className="mb-4 text-xs text-gray-400">* Wajib dipilih</p>
              )}

              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Catatan</p>
                <textarea
                  className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#4F6B6A]"
                  rows={2}
                  placeholder="Contoh: tidak pedas, pake sambel terpisah"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                    onClick={() => setQty(prev => Math.max(1, prev - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-800">{qty}</span>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                    onClick={() => setQty(prev => prev + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  className="bg-[#4F6B6A] px-6 hover:bg-[#3d5554]"
                  onClick={addToCart}
                >
                  Tambah ke Keranjang — {fmt(calcModalTotal())}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in sm:items-end"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-lg animate-slide-up flex-col rounded-t-2xl bg-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800">Pesanan Kamu</h2>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100"
                onClick={() => setIsCartOpen(false)}
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <p className="py-8 text-center text-gray-400">Keranjang kosong</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <button
                            className="ml-2 flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-200"
                            onClick={() => removeFromCart(idx)}
                          >
                            <X className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                        {item.options.length > 0 && (
                          <p className="mt-1 text-xs text-gray-400">
                            {item.options.map(o => o.name).join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-1 text-xs text-gray-400">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                      <p className="ml-3 whitespace-nowrap text-sm font-semibold text-gray-700">
                        {fmt(calcItemTotal(item))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-800">Total</span>
                  <span className="text-lg font-bold text-[#4F6B6A]">
                    {fmt(calcCartTotal())}
                  </span>
                </div>
                <Button
                  className="w-full bg-[#4F6B6A] py-6 text-base hover:bg-[#3d5554]"
                  onClick={submitOrder}
                  disabled={submitting || !customerName.trim()}
                >
                  {submitting ? 'Mengirim...' : 'Pesan Sekarang'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

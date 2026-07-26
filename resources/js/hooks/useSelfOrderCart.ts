import { useCallback, useMemo, useState } from 'react'
import type { CartItem, CartOption, MenuItem } from '@/types/self-order'

interface SelOptions {
    [groupId: number]: Record<number, number>
}

export function useSelfOrderCart() {
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null)
    const [qty, setQty] = useState(1)
    const [notes, setNotes] = useState('')
    const [selOptions, setSelOptions] = useState<SelOptions>({})

    const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

    const openMenu = useCallback((menu: MenuItem) => {
        setSelectedMenu(menu)
        setQty(1)
        setNotes('')
        const init: SelOptions = {}

        for (const g of menu.option_groups) {
            if (g.selection_type === 'single' && g.option_items.length > 0) {
                init[g.id] = { [g.option_items[0].id]: 1 }
            } else {
                init[g.id] = {}
            }
        }

        setSelOptions(init)
    }, [])

    const closeMenu = useCallback(() => setSelectedMenu(null), [])

    const toggleOption = useCallback(
        (groupId: number, itemId: number, type: 'single' | 'multiple') => {
            setSelOptions(prev => {
                if (type === 'single') {
                    return { ...prev, [groupId]: { [itemId]: 1 } }
                }

                const cur = prev[groupId] ?? {}

                if (cur[itemId]) {
                    const next = { ...cur }
                    delete next[itemId]

                    return { ...prev, [groupId]: next }
                }

                return { ...prev, [groupId]: { ...cur, [itemId]: 1 } }
            })
        },
        [],
    )

    const changeOptionQty = useCallback(
        (groupId: number, itemId: number, delta: number) => {
            setSelOptions(prev => {
                const cur = prev[groupId]?.[itemId] ?? 0
                const next = cur + delta

                if (next <= 0) {
                    const items = { ...prev[groupId] }
                    delete items[itemId]

                    return { ...prev, [groupId]: items }
                }

                return {
                    ...prev,
                    [groupId]: { ...prev[groupId], [itemId]: next },
                }
            })
        },
        [],
    )

    const calcModalTotal = useCallback((): number => {
        if (!selectedMenu) {
            return 0
        }

        const basePrice = Number(selectedMenu.price)
        let adj = 0

        for (const g of selectedMenu.option_groups) {
            const sel = selOptions[g.id] ?? {}

            for (const itemIdStr of Object.keys(sel)) {
                const itemId = Number(itemIdStr)
                const item = g.option_items.find(i => i.id === itemId)

                if (item) {
                    adj += Number(item.price_adjustment) * sel[itemId]
                }
            }
        }

        return (basePrice + adj) * qty
    }, [selectedMenu, selOptions, qty])

    const calcItemTotal = useCallback((item: CartItem): number => {
        const basePrice = Number(item.basePrice)
        const adj = item.options.reduce((s, o) => s + Number(o.priceAdjustment) * o.quantity, 0)

        return (basePrice + adj) * item.quantity
    }, [])

    const calcCartTotal = useCallback((): number => {
        return cart.reduce((s, i) => s + Number(calcItemTotal(i)), 0)
    }, [cart, calcItemTotal])

    const cartSubtotal = useMemo(() => calcCartTotal(), [calcCartTotal])
    const cartTax = useMemo(() => Math.round(cartSubtotal * 0.10), [cartSubtotal])
    const cartTotal = useMemo(() => cartSubtotal + cartTax, [cartSubtotal, cartTax])

    const onlineServiceCharge = useMemo(() => Math.round(cartSubtotal * 0.05), [cartSubtotal])
    const midtransCharge = useMemo(() => {
        const beforeCharge = cartSubtotal + cartTax + onlineServiceCharge

        return Math.round(beforeCharge * 2.5 / 100 / 100) * 100
    }, [cartSubtotal, cartTax, onlineServiceCharge])
    const onlineTotal = useMemo(() => cartSubtotal + cartTax + onlineServiceCharge + midtransCharge, [cartSubtotal, cartTax, onlineServiceCharge, midtransCharge])

    const addToCart = useCallback(() => {
        if (!selectedMenu) {
            return
        }

        const options: CartOption[] = []

        for (const g of selectedMenu.option_groups) {
            const sel = selOptions[g.id] ?? {}

            for (const itemIdStr of Object.keys(sel)) {
                const itemId = Number(itemIdStr)
                const item = g.option_items.find(i => i.id === itemId)

                if (item) {
                    options.push({
                        id: item.id,
                        name: item.name,
                        groupName: g.name,
                        priceAdjustment: Number(item.price_adjustment),
                        quantity: sel[itemId],
                    })
                }
            }
        }

        setCart(prev => [
            ...prev,
            {
                menuId: selectedMenu.id,
                name: selectedMenu.name,
                basePrice: Number(selectedMenu.price),
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

    return {
        cart,
        setCart,
        isCartOpen,
        setIsCartOpen,
        selectedMenu,
        qty,
        setQty,
        notes,
        setNotes,
        selOptions,
        cartCount,
        cartSubtotal,
        cartTax,
        cartTotal,
        onlineServiceCharge,
        midtransCharge,
        onlineTotal,
        openMenu,
        closeMenu,
        toggleOption,
        changeOptionQty,
        calcModalTotal,
        calcItemTotal,
        addToCart,
        removeFromCart,
    }
}

export interface OptionItem {
    id: number
    name: string
    price_adjustment: number
}

export interface OptionGroup {
    id: number
    name: string
    selection_type: 'single' | 'multiple'
    is_required: boolean
    option_items: OptionItem[]
}

export interface MenuItem {
    id: number
    name: string
    price: number
    is_available: boolean
    photo_path: string | null
    option_groups: OptionGroup[]
}

export interface Category {
    id: number
    name: string
    menus: MenuItem[]
}

export interface CartOption {
    id: number
    name: string
    groupName: string
    priceAdjustment: number
    quantity: number
}

export interface CartItem {
    menuId: number
    name: string
    basePrice: number
    quantity: number
    notes: string
    options: CartOption[]
}

export interface MidtransResponse {
    order_id: number
    order_number: string
    subtotal: number
    tax: number
    service_charge: number
    midtrans_charge: number
    total: number
    payment_type: string
    transaction_id: string | null
    qr_code?: string
    deeplink_url?: string
    va_number?: string
    bank?: string
    bill_key?: string
    biller_code?: string
    payment_code?: string
    store?: string
}

export type PaymentStatus = 'idle' | 'pending' | 'settlement' | 'failed'

export interface PaymentMethod {
    id: string
    name: string
    description: string
    category: 'qris' | 'ewallet' | 'va' | 'cstore'
}

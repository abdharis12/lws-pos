export interface OptionItem {
    id: number;
    name: string;
    price_adjustment: string;
    is_available: boolean;
}

export interface OptionGroup {
    id: number;
    name: string;
    selection_type: string;
    is_required: boolean;
    option_items: OptionItem[];
}

export interface MenuItem {
    id: number;
    name: string;
    description: string | null;
    price: string;
    is_available: boolean;
    photo_path: string | null;
    option_groups: OptionGroup[];
}

export interface Category {
    id: number;
    name: string;
    icon?: string | null;
    menus: MenuItem[];
}

export interface TableData {
    id: number;
    code: string;
    capacity: number;
    floor: string | null;
    status: string;
    locked_by: number | null;
    locked_by_user: { name: string } | null;
}

export interface ActiveSession {
    id: number;
    table_id: number;
    status: string;
}

export interface OrderItemOption {
    id?: number;
    price_adjustment: number;
    option_item: { id: number; name: string; price_adjustment: number };
}

export interface PendingOrder {
    id: number;
    customer_name: string | null;
    subtotal: string;
    total: string;
    created_at: string;
    status: string;
    order_type: string;
    table_session: { table: { code: string } } | null;
    payment: { method: string | null } | null;
    items: {
        id: number;
        qty: number;
        base_price: string;
        total_price: string;
        notes: string | null;
        options: OrderItemOption[];
        menu: { id: number; name: string; price: string };
    }[];
}

export interface CartItem {
    menu: MenuItem;
    qty: number;
    notes: string;
    selectedOptions: { itemId: number; name: string; adjustment: number; quantity: number }[];
}

export interface DiscountState {
    type: string | null;
    value: number;
    approvedBy: number | null;
}

export interface PrintReceiptData {
    items: CartItem[];
    discountType: string | null;
    discountValue: number;
    subtotal?: number;
    tax?: number;
    serviceCharge?: number;
    total?: number;
    orderNumber?: string | null;
    kasir?: string | null;
    tableCode?: string | null;
    customerName?: string | null;
    paymentMethod?: string | null;
    midtransCharge?: number;
    roundingAmount?: number;
    cashAmount?: number;
    change?: number;
}

export interface PosSessionData {
    id: number;
    session_date: string;
    opening_balance: number;
    opened_at: string;
    status: string;
    opened_by: { id: number; name: string } | null;
    total_cash: number;
    total_non_cash: number;
    total_transactions: number;
    closed_at: string | null;
    closed_by: { id: number; name: string } | null;
}

export interface PosPageProps {
    categories: Category[];
    tables: TableData[];
    pendingOrders: PendingOrder[];
    lastOrder?: OrderData | null;
}

export interface MejaPageProps {
    tables: TableData[];
    activeSessions: ActiveSession[];
    groupedTables?: Record<number, number[]> | null;
}

export interface OrderData {
    id: number;
    order_type: string;
    status: string;
    subtotal: number;
    tax: number;
    service_charge: number;
    midtrans_charge: number;
    rounding_amount?: number;
    discount: number;
    discount_type: string | null;
    discount_value: number | null;
    total: number;
    customer_name: string | null;
    created_at: string;
    created_by: { id: number; name: string } | null;
    table_session: { table: { code: string } } | null;
    grouped_tables: number[] | null;
    payment: { method: string } | null;
    items: {
        id: number;
        menu: { name: string; price: number };
        qty: number;
        base_price: number;
        total_price: number;
        notes: string | null;
        options: { price_adjustment: number; option_item: { name: string; price_adjustment: number } }[];
    }[];
}

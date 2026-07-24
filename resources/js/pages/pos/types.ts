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
    menus: MenuItem[];
}

export interface TableData {
    id: number;
    code: string;
    capacity: number;
    status: string;
}

export interface ActiveSession {
    id: number;
    table_id: number;
    status: string;
}

export interface OrderItemOption {
    option_item: { id: number; name: string; price_adjustment: string };
}

export interface PendingOrder {
    id: number;
    customer_name: string | null;
    subtotal: string;
    total: string;
    created_at: string;
    table_session: { table: { code: string } } | null;
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
    selectedOptions: { itemId: number; name: string; adjustment: number }[];
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
}

export interface PosPageProps {
    categories: Category[];
    tables: TableData[];
    activeSessions: ActiveSession[];
    pendingOrders: PendingOrder[];
}

export interface KitchenOrderItemOption {
    id?: number;
    name: string;
    quantity: number;
    option_item?: { name: string };
    optionItem?: { name: string };
}

export interface KitchenOrderItem {
    id: number;
    menu: { name: string; station: string | null };
    qty: number;
    notes: string | null;
    options: KitchenOrderItemOption[];
}

export interface KitchenOrder {
    id: number;
    order_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    customer_name: string | null;
    items: KitchenOrderItem[];
    table_session: { table: { code: string; floor: string | null } } | null;
}

export interface StationGroup {
    name: string;
    orders: KitchenOrder[];
}

export interface StatusConfig {
    label: string;
    color: string;
    dotColor: string;
}

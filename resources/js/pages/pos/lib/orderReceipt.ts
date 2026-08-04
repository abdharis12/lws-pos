import type { OrderData } from '../types';
import { orderTypeLabel } from './format';
import type { ReceiptData } from './receipt';

export function buildReceiptDataFromOrder(
    order: OrderData,
    options?: { orderNumber?: string; cashierOverride?: string | null },
): ReceiptData {
    const discountLabel =
        order.discount_type === 'percentage' && order.discount_value !== null
            ? `${order.discount_value}%`
            : null;

    return {
        orderNumber: options?.orderNumber ?? `TRX-LW-${order.id}`,
        createdAt: order.created_at,
        kasir: options?.cashierOverride ?? order.created_by?.name ?? '',
        orderType: orderTypeLabel(order.order_type),
        tableCode: order.table_session?.table?.code ?? null,
        customerName: order.customer_name ?? null,
        receiptItems: order.items.map(i => ({
            name: i.menu.name,
            qty: i.qty,
            basePrice: Number(i.base_price),
            totalPrice: Number(i.total_price),
            options: i.options.map(o => ({
                name: o.option_item.name,
                price: Number(o.price_adjustment),
                quantity: 1,
            })),
            notes: i.notes,
        })),
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        serviceCharge: Number(order.service_charge),
        midtransCharge: Number(order.midtrans_charge ?? 0),
        discount: Number(order.discount),
        roundingAmount: Number(order.rounding_amount ?? 0),
        discountLabel,
        total: Number(order.total),
        paymentMethod: order.payment?.method ?? null,
    };
}
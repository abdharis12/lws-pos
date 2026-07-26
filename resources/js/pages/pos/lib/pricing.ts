import type { CartItem } from '../types';

export const TAX_RATE = 0.10;
export const SERVICE_RATE = 0.05;
export const MIDTRANS_PERCENT = 2.5;

export function calcSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => {
        const optAdj = item.selectedOptions.reduce((s, o) => s + o.adjustment, 0);

        return sum + (Number(item.menu.price) + optAdj) * item.qty;
    }, 0);
}

export function calcDiscount(subtotal: number, type: string | null, value: number): number {
    if (!type || !value) {
return 0;
}

    if (type === 'percentage') {
return Math.min(subtotal * (value / 100), subtotal);
}

    return Math.min(value, subtotal);
}

export function calcTax(subtotal: number): number {
    return Math.round(subtotal * TAX_RATE);
}

export function calcServiceCharge(subtotal: number): number {
    return roundPrice(subtotal * SERVICE_RATE);
}

export function roundPrice(n: number): number {
    return Math.round(n * 100) / 100;
}

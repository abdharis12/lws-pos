import type { CartItem } from '../types';

export function calcSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => {
        const optAdj = item.selectedOptions.reduce((s, o) => s + o.adjustment * o.quantity, 0);

        return sum + (Number(item.menu.price) + optAdj) * item.qty;
    }, 0);
}

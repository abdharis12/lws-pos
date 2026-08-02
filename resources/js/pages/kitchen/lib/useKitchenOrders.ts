import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import type { RefObject } from 'react';
import { printLabel } from './printLabel';
import type { LabelData, LabelItem } from './printLabel';
import { optionDisplayName, playBeep } from './utils';

interface OrderPaidItem {
    menu: { name: string; station: string | null };
    qty: number;
    notes: string | null;
    options: { name: string; quantity: number }[];
}

interface OrderPaidPayload {
    order: {
        id: number;
        order_type: string;
        customer_name: string | null;
        created_at: string;
        items: OrderPaidItem[];
        table_session: { table: { code: string } } | null;
    };
}

export function useKitchenOrders(
    printFrameRef: RefObject<HTMLIFrameElement | null>,
    printEnabled: boolean,
    soundEnabled: boolean,
    printedIdsRef: RefObject<Set<number>>,
): void {
    const { auth } = usePage<{ auth: { outlet_id?: number } }>().props;
    const outletId = auth?.outlet_id;

    useEcho<OrderPaidPayload>(
        outletId ? `outlet.${outletId}.kitchen` : '',
        '.OrderPaid',
        (e) => {
            const order = e.order;

            if (soundEnabled) {
                playBeep();
            }

            if (printedIdsRef.current.has(order.id)) {
                return;
            }

            printedIdsRef.current.add(order.id);

            if (printEnabled) {
                const stationsMap = new Map<string, LabelItem[]>();

                for (const item of order.items) {
                    const station = item.menu.station || '';

                    if (!stationsMap.has(station)) {
stationsMap.set(station, []);
}

                    stationsMap.get(station)!.push({
                        name: item.menu.name,
                        qty: item.qty,
                        notes: item.notes,
                        options: (item.options ?? []).map((opt) => ({
                            name: optionDisplayName(opt),
                            quantity: opt.quantity,
                        })),
                    });
                }

                setTimeout(() => {
                    for (const [station, items] of stationsMap) {
                        const labelData: LabelData = {
                            station,
                            tableCode: order.table_session?.table?.code ?? null,
                            orderId: order.id,
                            items,
                            customerName: order.customer_name,
                            orderType: order.order_type,
                            createdAt: order.created_at,
                        };
                        printLabel(printFrameRef.current, labelData);
                    }
                }, 500);
            }

            router.reload({ only: ['stations', 'unassignedOrders', 'readyOrders'] });
        },
        [outletId, printEnabled, soundEnabled, printFrameRef, printedIdsRef],
    );
}

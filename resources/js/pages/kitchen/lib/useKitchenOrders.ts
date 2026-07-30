import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { playBeep } from './utils';
import { printLabel, type LabelData, type LabelItem } from './printLabel';

interface OrderPaidPayload {
    order: {
        id: number;
        order_type: string;
        customer_name: string | null;
        created_at: string;
        items: {
            menu: { name: string; station: string | null };
            qty: number;
            notes: string | null;
        }[];
        table_session: { table: { code: string } } | null;
    };
}

export function useKitchenOrders(printFrameRef: HTMLIFrameElement | null, soundEnabled: boolean): void {
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

            const stationsMap = new Map<string, LabelItem[]>();
            for (const item of order.items) {
                const station = item.menu.station || 'Lainnya';
                if (!stationsMap.has(station)) stationsMap.set(station, []);
                stationsMap.get(station)!.push({
                    name: item.menu.name,
                    qty: item.qty,
                    notes: item.notes,
                    options: [],
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
                    printLabel(printFrameRef, labelData);
                }
            }, 500);

            router.reload({ only: ['stations', 'unassignedOrders'], preserveScroll: true });
        },
        [outletId, soundEnabled, printFrameRef],
    );
}

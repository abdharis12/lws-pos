import { Head, usePoll } from '@inertiajs/react';
import { BellRing, ChefHat } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import KitchenHeader from './components/KitchenHeader';
import OrderCard from './components/OrderCard';
import ReadyOrderCard from './components/ReadyOrderCard';
import { printLabel } from './lib/printLabel';
import type { LabelData } from './lib/printLabel';
import { useKitchenOrders } from './lib/useKitchenOrders';
import { filterNewOrderIds, playBeep } from './lib/utils';
import type { StationGroup, KitchenOrder } from './types';

interface Props {
    stations: StationGroup[];
    unassignedOrders: KitchenOrder[];
    readyOrders: KitchenOrder[];
}

export default function KitchenIndex({
    stations,
    unassignedOrders,
    readyOrders,
}: Props) {
    const [newIds, setNewIds] = useState<Set<number>>(new Set());
    const [soundEnabled, setSoundEnabled] = useState(true);
    const prevIds = useRef<Set<number>>(new Set());
    const printedIdsRef = useRef<Set<number>>(new Set());
    const initialized = useRef(false);
    const printFrameRef = useRef<HTMLIFrameElement>(null);
    const printEnabled = true;

    useKitchenOrders(
        printFrameRef,
        printEnabled,
        soundEnabled,
        printedIdsRef,
    );

    usePoll(10000, { only: ['stations', 'unassignedOrders', 'readyOrders'] });

    const allOrders = useMemo(
        () => [
            ...stations.flatMap((s) => s.orders),
            ...unassignedOrders,
        ],
        [stations, unassignedOrders],
    );

    const allFlat = useMemo(() => {
        const flatOrders = stations.flatMap((s) =>
            s.orders.map((o) => ({ ...o, _stationName: s.name })),
        );
        const flatUnassigned = unassignedOrders.map((o) => ({
            ...o,
            _stationName: 'Lainnya' as string,
        }));

        return [...flatOrders, ...flatUnassigned];
    }, [stations, unassignedOrders]);

    const printOrderLabel = useCallback(
        (order: KitchenOrder, stationName?: string) => {
            const station =
                stationName && stationName !== "LW's by Bubur Kang LW"
                    ? stationName
                    : order.items[0]?.menu.station || "LW's by Bubur Kang LW";

            const labelData: LabelData = {
                station,
                tableCode: order.table_session?.table?.code ?? null,
                orderId: order.id,
                items: order.items.map((item) => ({
                    name: item.menu.name,
                    qty: item.qty,
                    notes: item.notes,
                    options: [],
                })),
                customerName: order.customer_name,
                orderType: order.order_type,
                createdAt: order.created_at,
            };

            printLabel(printFrameRef.current, labelData);
        },
        [printFrameRef],
    );

    useEffect(() => {
        const fresh = filterNewOrderIds(allOrders, prevIds.current);
        const isFirstRun = !initialized.current;
        initialized.current = true;

        if (fresh.size > 0) {
            setNewIds(fresh);

            if (soundEnabled) {
                playBeep();
            }

            if (!isFirstRun) {
                const unprinted = [...fresh].filter(
                    (id) => !printedIdsRef.current.has(id),
                );

                if (unprinted.length > 0 && printEnabled) {
                    const copies = allFlat.filter((o) =>
                        unprinted.includes(o.id),
                    );

                    copies.forEach((copy) => {
                        printedIdsRef.current.add(copy.id);
                        printOrderLabel(copy, copy._stationName);
                    });
                }
            }

            const t = setTimeout(() => setNewIds(new Set()), 4000);
            prevIds.current = new Set(allOrders.map((o) => o.id));

            return () => clearTimeout(t);
        }

        prevIds.current = new Set(allOrders.map((o) => o.id));
    }, [allOrders, allFlat, printEnabled, soundEnabled, printOrderLabel]);

    const hasOrders = allOrders.length > 0 || readyOrders.length > 0;

    return (
        <div
            className="min-h-screen text-white bg-black"
        >
            <Head title="Kitchen Display" />

            <style>{`
                @keyframes new-order-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
                    50% { box-shadow: 0 0 40px 8px rgba(34,197,94,0.2); }
                }
                .new-order { animation: new-order-glow 4s ease-in-out; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
            `}</style>

            <div className="mx-auto max-w-7xl p-4 px-4">
                <KitchenHeader
                    orderCount={allOrders.length}
                    soundEnabled={soundEnabled}
                    onSoundToggle={() => setSoundEnabled((s) => !s)}
                />

                {readyOrders.length > 0 && (
                    <div className="mb-8">
                        <div className="mb-3 flex items-center gap-2">
                            <BellRing className="size-4 text-emerald-400" />
                            <h2 className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">
                                Siap Saji
                            </h2>
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                                {readyOrders.length}
                            </span>
                        </div>
                        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {readyOrders.map((order) => (
                                <ReadyOrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    </div>
                )}

                {!hasOrders ? (
                    <div className="flex flex-col items-center justify-center py-32 text-white/30">
                        <ChefHat className="mb-6 size-20 opacity-80" />
                        <p className="text-lg font-medium">
                            Belum ada pesanan masuk
                        </p>
                        <p className="mt-1 text-sm">
                            Pesanan akan muncul di sini setelah pembayaran
                        </p>
                    </div>
                ) : (
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {allFlat.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isNew={newIds.has(order.id)}
                                stationName={order._stationName}
                                onPrint={() =>
                                    printOrderLabel(order, order._stationName)
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            <iframe
                ref={printFrameRef}
                style={{
                    position: 'absolute',
                    width: 0,
                    height: 0,
                    border: 'none',
                }}
                title="print-label"
            />
        </div>
    );
}

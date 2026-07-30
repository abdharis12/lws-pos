import { Head, usePoll } from '@inertiajs/react';
import { ChefHat, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import KitchenHeader from './components/KitchenHeader';
import OrderCard from './components/OrderCard';
import { filterNewOrderIds, playBeep } from './lib/utils';
import { useKitchenOrders } from './lib/useKitchenOrders';
import type { StationGroup, KitchenOrder } from './types';

interface Props {
    stations: StationGroup[];
    unassignedOrders: KitchenOrder[];
}

export default function KitchenIndex({ stations, unassignedOrders }: Props) {
    const [newIds, setNewIds] = useState<Set<number>>(new Set());
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [printEnabled, setPrintEnabled] = useState(true);
    const prevIds = useRef<Set<number>>(new Set());
    const printFrameRef = useRef<HTMLIFrameElement>(null);

    useKitchenOrders(printFrameRef.current, printEnabled && soundEnabled);

    usePoll(10000, { only: ['stations', 'unassignedOrders'] });

    const allOrders = [...stations.flatMap(s => s.orders), ...unassignedOrders];

    useEffect(() => {
        const fresh = filterNewOrderIds(allOrders, prevIds.current);

        if (fresh.size > 0) {
            setNewIds(fresh);

            if (soundEnabled) {
playBeep();
}

            const t = setTimeout(() => setNewIds(new Set()), 4000);
            prevIds.current = new Set(allOrders.map(o => o.id));

            return () => clearTimeout(t);
        }

        prevIds.current = new Set(allOrders.map(o => o.id));
    }, [allOrders, soundEnabled]);

    const hasOrders = allOrders.length > 0;

    const flatOrders = stations.flatMap(s =>
        s.orders.map(o => ({ ...o, _stationName: s.name }))
    );
    const flatUnassigned = unassignedOrders.map(o => ({ ...o, _stationName: 'Lainnya' as string }));
    const allFlat = [...flatOrders, ...flatUnassigned];

    return (
        <div className="min-h-screen text-white"
            style={{ backgroundColor: '#0f172a' }}
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

            <div className="mx-auto max-w-7xl px-4 p-8">
                <KitchenHeader
                    orderCount={allOrders.length}
                    soundEnabled={soundEnabled}
                    onSoundToggle={() => setSoundEnabled(s => !s)}
                    printEnabled={printEnabled}
                    onPrintToggle={() => setPrintEnabled(s => !s)}
                />

                {!hasOrders ? (
                    <div className="flex flex-col items-center justify-center py-32 text-white/30">
                        <ChefHat className="mb-6 size-20 opacity-80" />
                        <p className="text-lg font-medium">Belum ada pesanan masuk</p>
                        <p className="mt-1 text-sm">Pesanan akan muncul di sini setelah pembayaran</p>
                    </div>
                ) : (
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {allFlat.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isNew={newIds.has(order.id)}
                                stationName={order._stationName}
                            />
                        ))}
                    </div>
                )}
            </div>

            <iframe ref={printFrameRef} style={{ position: 'absolute', width: 0, height: 0, border: 'none' }} title="print-label" />
        </div>
    );
}

import { Check, MapPin, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { elapsedBg, elapsedColor, calcElapsed } from '../lib/utils';
import type { KitchenOrder } from '../types';

interface Props {
    order: KitchenOrder;
}

export default function ReadyOrderCard({ order }: Props) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 30000);

        return () => clearInterval(id);
    }, []);

    const elapsed = calcElapsed(order.updated_at, now);
    const tableCode = order.table_session?.table?.code ?? order.order_type;
    const floor = order.table_session?.table?.floor;
    const totalQty = order.items.reduce((sum, i) => sum + i.qty, 0);

    return (
        <div
            className="relative min-w-0 rounded-xl border border-emerald-500/40 transition-all"
            style={{
                backgroundColor: 'rgba(6,78,59,0.25)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 0 24px rgba(34,197,94,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
        >
            <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="flex shrink-0 size-15 items-center justify-center rounded-lg text-sm font-bold text-white"
                            style={{ backgroundColor: '#15803d' }}
                        >
                            {tableCode}
                        </span>
                        <div>
                            <p className="text-xs font-semibold text-emerald-300">
                                {floor ? `${floor} • ` : ''}Order #{order.id}
                            </p>
                            {order.customer_name && (
                                <p className="text-[11px] text-white/60">{order.customer_name}</p>
                            )}
                        </div>
                    </div>
                    <span
                        className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: elapsedBg(elapsed.mins), color: elapsedColor(elapsed.mins) }}
                    >
                        <Timer className="size-3" />
                        {elapsed.text}
                    </span>
                </div>

                <div className="mt-3 min-w-0 space-y-1">
                    {order.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                            <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-bold tabular-nums text-emerald-300">
                                {item.qty}x
                            </span>
                            <span className="min-w-0 truncate text-white">{item.menu.name}</span>
                            {item.notes && <span className="shrink-0 text-[10px] italic text-amber-400/80">📝</span>}
                        </div>
                    ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-2.5"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                >
                    <span className="flex items-center gap-1 text-[11px] text-white/50">
                        <MapPin className="size-3" />
                        {tableCode}
                    </span>
                    <span className={cn(
                        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-emerald-300',
                        'bg-emerald-500/20',
                    )}>
                        <Check className="size-3" />
                        Menunggu diantar · {totalQty} item
                    </span>
                </div>
            </div>
        </div>
    );
}

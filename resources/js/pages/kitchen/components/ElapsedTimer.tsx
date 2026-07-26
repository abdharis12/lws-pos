import { useState, useEffect } from 'react';
import { calcElapsed, elapsedColor, elapsedBg, progressPercent } from '../lib/utils';

export default function ElapsedTimer({ createdAt }: { createdAt: string }) {
    const [elapsed, setElapsed] = useState(() => calcElapsed(createdAt));

    useEffect(() => {
        const id = setInterval(() => setElapsed(calcElapsed(createdAt)), 30000);

        return () => clearInterval(id);
    }, [createdAt]);

    const color = elapsedColor(elapsed.mins);
    const bg = elapsedBg(elapsed.mins);
    const progress = progressPercent(elapsed.mins);

    return (
        <div className="flex items-center gap-2">
            <div className="flex h-7 w-16 items-center justify-center rounded-md text-[11px] font-bold tabular-nums"
                style={{ backgroundColor: bg, color }}
            >
                {elapsed.text}
            </div>
            <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                        width: `${Math.min(100, progress)}%`,
                        backgroundColor: color,
                        opacity: 0.8,
                    }}
                />
            </div>
        </div>
    );
}

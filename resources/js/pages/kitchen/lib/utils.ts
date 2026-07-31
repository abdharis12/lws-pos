import type { KitchenOrder, StatusConfig } from '../types';

export function calcElapsed(createdAt: string, now = Date.now()): { text: string; mins: number } {
    const diff = now - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 60) {
return { text: `${mins}m`, mins };
}

    const h = Math.floor(mins / 60);
    const m = mins % 60;

    return { text: `${h}j ${m}m`, mins };
}

export function elapsedColor(mins: number): string {
    if (mins < 5) {
return '#22c55e';
}

    if (mins < 10) {
return '#eab308';
}

    return '#ef4444';
}

export function elapsedBg(mins: number): string {
    if (mins < 5) {
return 'rgba(34,197,94,0.15)';
}

    if (mins < 10) {
return 'rgba(234,179,8,0.15)';
}

    return 'rgba(239,68,68,0.15)';
}

export function progressPercent(mins: number, target = 15): number {
    return Math.min(100, Math.round((mins / target) * 100));
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
    paid: { label: 'Menunggu', color: '#eab308', dotColor: '#eab308' },
    processing: { label: 'Dimasak', color: '#3b82f6', dotColor: '#3b82f6' },
    ready: { label: 'Siap Saji', color: '#22c55e', dotColor: '#22c55e' },
    served: { label: 'Tersaji', color: '#6b7280', dotColor: '#6b7280' },
};

export function getStatusConfig(status: string): StatusConfig {
    return STATUS_CONFIG[status] ?? { label: status, color: '#6b7280', dotColor: '#6b7280' };
}

export function stationIcon(name: string): string {
    const map: Record<string, string> = {
        main: '🍽️',
        grill: '🔥',
        fry: '🍳',
        steam: '♨️',
        cold: '🧊',
        dessert: '🍰',
        bakery: '🥖',
        minuman: '🥤',
        lainnya: '📦',
    };

    return map[name.toLowerCase()] ?? '👨‍🍳';
}

export function filterNewOrderIds(current: KitchenOrder[], previous: Set<number>): Set<number> {
    const currentIds = new Set(current.map(o => o.id));

    return new Set([...currentIds].filter(id => !previous.has(id)));
}

export function playBeep() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch {}
}

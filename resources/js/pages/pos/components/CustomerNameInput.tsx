import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';

interface Props {
    value: string;
    onChange: (value: string) => void;
    variant?: 'sidebar' | 'mobile';
}

export default function CustomerNameInput({ value, onChange, variant = 'sidebar' }: Props) {
    if (variant === 'mobile') {
        return (
            <div className="p-2 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}` }}>
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="Nama pelanggan untuk pemanggilan..."
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all focus:ring-1"
                    style={{ borderColor: BORDER, color: INK, '--tw-ring-color': PRIMARY } as React.CSSProperties}
                />
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
            <h2 className="text-base font-semibold" style={{ color: INK }}>Nama Pelanggan</h2>
            <p className="mt-0.5 text-xs" style={{ color: MUTED }}>Untuk pemanggilan saat pesanan siap</p>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder="Masukkan nama..."
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all focus:ring-1"
                style={{ borderColor: BORDER, color: INK, '--tw-ring-color': PRIMARY } as React.CSSProperties}
            />
        </div>
    );
}

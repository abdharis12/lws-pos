import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';

interface Props {
    floors: string[];
    selectedFloor: string | null;
    onSelect: (floor: string | null) => void;
    variant?: 'sidebar' | 'mobile';
}

const FLOOR_ICONS = ['①', '②', '③', '④', '🌿'];

export default function FloorTabs({ floors, selectedFloor, onSelect, variant = 'sidebar' }: Props) {
    const items = [
        { label: 'Semua', value: null as string | null, icon: '◎' },
        ...floors.map((f, i) => ({
            label: f,
            value: f,
            icon: FLOOR_ICONS[i] ?? '●',
        })),
    ];

    if (variant === 'mobile') {
        return (
            <div className="flex gap-1.5 overflow-x-auto p-2 lg:hidden" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: `${INK}04` }}>
                {items.map(({ label, value, icon }) => {
                    const isActive = selectedFloor === value;

                    return (
                        <button
                            key={label}
                            onClick={() => onSelect(value)}
                            className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
                            style={{
                                backgroundColor: isActive ? '#fff' : 'transparent',
                                color: isActive ? INK : MUTED,
                                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                transform: isActive ? 'scale(1.04)' : 'scale(1)',
                            }}
                        >
                            <span style={{ opacity: 0.5 }}>{icon}</span>
                            {label}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="mt-2 flex flex-wrap gap-1 rounded-lg p-1" style={{ backgroundColor: `${INK}08` }}>
            {items.map(({ label, value, icon }) => {
                const isActive = selectedFloor === value;

                return (
                    <button
                        key={label}
                        onClick={() => onSelect(value)}
                        className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200"
                        style={{
                            backgroundColor: isActive ? '#4F6B6A' : 'transparent',
                            color: isActive ? '#fff' : MUTED,
                            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        }}
                        onMouseEnter={e => {
                            if (!isActive) {
 e.currentTarget.style.backgroundColor = `${INK}08`; e.currentTarget.style.color = INK; 
}
                        }}
                        onMouseLeave={e => {
                            if (!isActive) {
 e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = MUTED; 
}
                        }}
                    >
                        <span style={{ opacity: 0.5, fontSize: '9px' }}>{icon}</span>
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

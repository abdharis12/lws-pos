import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';
import { cn } from '@/lib/utils';

interface Props {
    orderType: 'dine_in' | 'takeaway';
    onChange: (type: 'dine_in' | 'takeaway') => void;
    variant?: 'sidebar' | 'mobile';
}

const TYPES = [
    { value: 'dine_in' as const, label: 'Dine-in' },
    { value: 'takeaway' as const, label: 'Take Away' },
];

export default function OrderTypeSelector({ orderType, onChange, variant = 'sidebar' }: Props) {
    const containerClass = variant === 'mobile'
        ? 'flex gap-1 p-2 lg:hidden'
        : 'rounded-xl bg-white p-2 shadow-sm flex';

    return (
        <div className={containerClass} style={{ borderBottom: variant === 'mobile' ? `1px solid ${BORDER}` : `1px solid ${BORDER}` }}>
            {TYPES.map(({ value, label }) => (
                <button
                    key={value}
                    onClick={() => onChange(value)}
                    className={cn(
                        'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                        orderType === value ? 'text-white shadow-sm' : 'opacity-70 hover:opacity-100',
                    )}
                    style={{
                        backgroundColor: orderType === value ? PRIMARY : 'transparent',
                        color: orderType === value ? '#fff' : INK,
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

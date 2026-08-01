import { cn } from '@/lib/utils';

const INK = 'oklch(0.48 0.032 195.5)';
const BORDER = 'oklch(0.80 0.038 88.5 / 0.35)';

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
        ? 'flex gap-1 p-2 border-b lg:hidden'
        : 'rounded-xl flex';

    return (
        <div className={containerClass} style={{ borderColor: variant === 'mobile' ? BORDER : undefined }}>
            {TYPES.map(({ value, label }) => (
                <button
                    key={value}
                    onClick={() => onChange(value)}
                    className={cn(
                        'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                        orderType === value ? 'text-white shadow-sm' : 'opacity-70 hover:opacity-100',
                    )}
                    style={{
                        backgroundColor: orderType === value ? INK : 'transparent',
                        color: orderType === value ? '#fff' : INK,
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

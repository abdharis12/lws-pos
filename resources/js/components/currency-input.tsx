import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps
    extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> {
    value: string;
    onChange: (raw: string) => void;
}

function formatRupiah(raw: string): string {
    return raw ? Number(raw).toLocaleString('id-ID') : '';
}

function CurrencyInput({ value, onChange, className, ...props }: CurrencyInputProps) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-500">
                Rp
            </span>
            <Input
                type="text"
                inputMode="numeric"
                value={formatRupiah(value)}
                onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
                className={cn('pl-9', className)}
                {...props}
            />
        </div>
    );
}

export { CurrencyInput };

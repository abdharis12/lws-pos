import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';
import type { CartItem } from '../types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    splitInputValue: string;
    onSplitInputChange: (value: string) => void;
    onApply: (count: number) => void;
    cartItems: CartItem[];
}

export default function SplitBillDialog({ open, onOpenChange, splitInputValue, onSplitInputChange, onApply, cartItems }: Props) {
    const count = Number(splitInputValue);
    const subtotal = cartItems.reduce((s, item) => {
        const optAdj = item.selectedOptions.reduce((a, o) => a + o.adjustment, 0);
        return s + (Number(item.menu.price) + optAdj) * item.qty;
    }, 0);
    const perBill = count >= 2 ? Math.round(subtotal / count) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm" style={{ backgroundColor: CREAM }}>
                <DialogHeader>
                    <DialogTitle style={{ color: INK }}>Split Bill</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: MUTED }}>
                        Bagi pesanan menjadi beberapa bill.
                    </p>
                    <div>
                        <Label style={{ color: INK }}>Jumlah bagian</Label>
                        <Input
                            type="number" min={2} max={20}
                            value={splitInputValue}
                            onChange={e => onSplitInputChange(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    {cartItems.length > 0 && count >= 2 && (
                        <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: CREAM, border: `1px solid ${BORDER}` }}>
                            <p className="mb-1 font-medium" style={{ color: INK }}>Pratinjau:</p>
                            <p style={{ color: MUTED }}>
                                {count} bill × Rp {perBill.toLocaleString('id-ID')} (rata-rata)
                            </p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => onApply(count)}
                            className="flex-1"
                            disabled={!splitInputValue || count < 2}
                            style={{ backgroundColor: PRIMARY }}
                        >
                            Terapkan
                        </Button>
                        <Button variant="outline" onClick={() => onOpenChange(false)} style={{ borderColor: BORDER, color: INK }}>
                            Batal
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

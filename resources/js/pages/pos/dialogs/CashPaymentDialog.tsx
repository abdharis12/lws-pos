import { useState, useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    total: number;
    onConfirm: (amountGiven: number) => void;
    processing: boolean;
}

export default function CashPaymentDialog({ open, onOpenChange, total, onConfirm, processing }: Props) {
    const [amountGiven, setAmountGiven] = useState('');
    const numericGiven = Number(amountGiven.replace(/\./g, '')) || 0;
    const change = useMemo(() => Math.max(0, numericGiven - total), [numericGiven, total]);
    const isEnough = numericGiven >= total;

    function formatCurrency(val: number): string {
        return val.toLocaleString('id-ID');
    }

    function handleConfirm() {
        if (!isEnough || processing) return;
        onConfirm(numericGiven);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm" style={{ backgroundColor: CREAM }}>
                <DialogHeader>
                    <DialogTitle style={{ color: INK }}>Pembayaran Tunai</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                    <div className="text-center">
                        <p className="text-sm" style={{ color: MUTED }}>Total Belanja</p>
                        <p className="text-3xl font-bold" style={{ color: PRIMARY }}>
                            Rp {formatCurrency(total)}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                        <Label style={{ color: INK }}>Jumlah Dibayar</Label>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: MUTED }}>Rp</span>
                            <Input
                                type="text"
                                inputMode="numeric"
                                value={amountGiven}
                                onChange={e => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    setAmountGiven(raw ? Number(raw).toLocaleString('id-ID') : '');
                                }}
                                placeholder="0"
                                className="text-lg font-semibold"
                                style={{ color: INK }}
                                autoFocus
                            />
                        </div>
                        {amountGiven && !isEnough && (
                            <p className="mt-1 text-xs text-red-500">Jumlah belum mencukupi total</p>
                        )}
                    </div>

                    {amountGiven && isEnough && (
                        <div className="rounded-xl p-4 text-center" style={{ backgroundColor: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
                            <p className="text-sm" style={{ color: MUTED }}>Kembalian</p>
                            <p className="text-2xl font-bold" style={{ color: PRIMARY }}>
                                Rp {formatCurrency(change)}
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleConfirm}
                        className="w-full"
                        size="lg"
                        disabled={!isEnough || processing}
                        style={{ backgroundColor: PRIMARY }}
                    >
                        <Wallet className="mr-2 size-4" />
                        {processing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

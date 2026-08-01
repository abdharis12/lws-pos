import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CREAM, INK, PRIMARY } from '../constants';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (method: string) => void;
    processing: boolean;
}

export default function PaymentDialog({ open, onOpenChange, onConfirm, processing }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm" style={{ backgroundColor: CREAM }}>
                <DialogHeader>
                    <DialogTitle style={{ color: INK }}>Pilih Metode Pembayaran</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <Button onClick={() => onConfirm('cash')} className="w-full" size="lg" disabled={processing} style={{ backgroundColor: PRIMARY }}>
                        <Wallet className="mr-2 size-4" /> Bayar Cash
                    </Button>
                    <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full" disabled={processing}>
                        Batal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

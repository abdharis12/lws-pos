import { Printer, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';

interface Props {
    open: boolean;
    onClose: () => void;
    onPrint: () => void;
    type: 'cash' | 'qris' | 'save';
    changeAmount?: number;
    title?: string;
    message?: string;
}

export default function SuccessDialog({ open, onClose, onPrint, type, changeAmount, title, message }: Props) {
    const [show, setShow] = useState(false);
    const [prevOpen, setPrevOpen] = useState(open);

    if (open !== prevOpen) {
        setPrevOpen(open);

        if (open) {
            setShow(false);
        }
    }

    useEffect(() => {
        if (open) {
            const t = setTimeout(() => setShow(true), 100);

            return () => clearTimeout(t);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-sm" style={{ backgroundColor: CREAM }}>
                <div className="flex flex-col items-center py-6 text-center">
                    <div className="relative mb-5">
                        <div className={`flex size-20 items-center justify-center rounded-full transition-all duration-500 ${show ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                            style={{ backgroundColor: `${PRIMARY}12` }}>
                            <div className={`flex size-14 items-center justify-center rounded-full transition-all duration-500 delay-200 ${show ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                                style={{ backgroundColor: PRIMARY }}>
                                <Check className="size-8 text-white" />
                            </div>
                        </div>
                    </div>

                    <h2 className={`text-xl font-bold transition-all duration-500 delay-300 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                        style={{ color: INK }}>
                        {title || (type === 'save' ? 'Pesanan Disimpan' : 'Pembayaran Berhasil')}
                    </h2>
                    <p className={`mt-1 text-sm transition-all duration-500 delay-400 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                        style={{ color: MUTED }}>
                        {message || (type === 'save' ? 'Pesanan telah dikirim ke dapur' : 'Terima kasih atas pembayaran Anda')}
                    </p>

                    {type === 'cash' && changeAmount !== undefined && changeAmount > 0 && (
                        <div className={`mt-4 w-full rounded-xl p-4 transition-all duration-500 delay-500 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                            style={{ backgroundColor: `${PRIMARY}08`, border: `1px solid ${PRIMARY}20` }}>
                            <p className="text-sm" style={{ color: MUTED }}>Kembalian</p>
                            <p className="text-2xl font-bold" style={{ color: PRIMARY }}>
                                Rp {changeAmount.toLocaleString('id-ID')}
                            </p>
                        </div>
                    )}

                    <div className={`mt-6 flex w-full flex-col gap-2 transition-all duration-500 delay-600 ${show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <Button onClick={onPrint} className="w-full" size="lg" style={{ backgroundColor: PRIMARY }}>
                            <Printer className="mr-2 size-4" /> Cetak Struk
                        </Button>
                        <Button onClick={onClose} variant="outline">
                            Selesai
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

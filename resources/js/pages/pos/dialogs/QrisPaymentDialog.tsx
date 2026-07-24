import { useEffect, useRef } from 'react';
import { QrCode, LoaderCircle, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    total: number;
    qrCodeUrl: string | null;
    processing: boolean;
    error: string | null;
    onPoll: () => void;
    onCancel: () => void;
    paymentStatus: 'pending' | 'settlement' | 'failed';
}

export default function QrisPaymentDialog({
    open, onOpenChange, total, qrCodeUrl, processing, error,
    onPoll, onCancel, paymentStatus,
}: Props) {
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (open && paymentStatus === 'pending') {
            pollRef.current = setInterval(onPoll, 3000);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [open, paymentStatus, onPoll]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm" style={{ backgroundColor: CREAM }}>
                <DialogHeader>
                    <DialogTitle style={{ color: INK }}>Pembayaran QRIS</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4 py-2">
                    <div className="text-center">
                        <p className="text-sm" style={{ color: MUTED }}>Total Pembayaran</p>
                        <p className="text-3xl font-bold" style={{ color: PRIMARY }}>
                            Rp {total.toLocaleString('id-ID')}
                        </p>
                    </div>

                    {paymentStatus === 'settlement' ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <div className="flex size-16 items-center justify-center rounded-full" style={{ backgroundColor: `${PRIMARY}12` }}>
                                <Check className="size-8" style={{ color: PRIMARY }} />
                            </div>
                            <p className="font-semibold" style={{ color: INK }}>Pembayaran Berhasil</p>
                        </div>
                    ) : paymentStatus === 'failed' ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <AlertCircle className="size-12 text-red-500" />
                            <p className="font-semibold text-red-500">Pembayaran Gagal</p>
                            <Button onClick={onCancel} variant="outline" style={{ borderColor: BORDER, color: INK }}>
                                Tutup
                            </Button>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <AlertCircle className="size-12 text-amber-500" />
                            <p className="text-sm" style={{ color: MUTED }}>{error}</p>
                            <p className="text-xs" style={{ color: MUTED }}>
                                Atur MIDTRANS_SERVER_KEY di .env untuk mengaktifkan QRIS
                            </p>
                            <Button onClick={onCancel} variant="outline" style={{ borderColor: BORDER, color: INK }}>
                                Tutup
                            </Button>
                        </div>
                    ) : processing && !qrCodeUrl ? (
                        <div className="flex flex-col items-center gap-3 py-8">
                            <LoaderCircle className="size-10 animate-spin" style={{ color: PRIMARY }} />
                            <p className="text-sm" style={{ color: MUTED }}>Memproses pembayaran...</p>
                        </div>
                    ) : qrCodeUrl ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="rounded-xl bg-white p-4 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
                                <img src={qrCodeUrl} alt="QRIS QR Code" className="size-48 object-contain" />
                            </div>
                            <p className="text-xs text-center" style={{ color: MUTED }}>
                                Scan QR code di atas menggunakan<br />aplikasi GoPay, OVO, atau LinkAja
                            </p>
                            <div className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                                <LoaderCircle className="size-3 animate-spin" />
                                <span>Menunggu pembayaran...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <QrCode className="size-12" style={{ color: MUTED }} />
                            <p className="text-sm" style={{ color: MUTED }}>Generate QRIS...</p>
                        </div>
                    )}

                    {paymentStatus === 'pending' && !error && (
                        <Button onClick={onCancel} variant="outline" className="w-full" style={{ borderColor: BORDER, color: INK }}>
                            Batal
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { Bluetooth, Cable, Check, Loader2, Printer, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { isWebBluetoothSupported } from '@/lib/printers/blePrinter';
import {
    getPairedPrinterName,
    pairPrinter,
    unpair,
} from '@/lib/printers/printReceipt';
import { isWebUsbSupported } from '@/lib/printers/usbPrinter';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPairChange?: (name: string | null) => void;
}

function Toast({ message, kind }: { message: string; kind: 'success' | 'error' | 'info' }) {
    const bg = kind === 'success' ? '#10b981' : kind === 'error' ? '#e11d48' : PRIMARY;

    return (
        <div
            className="rounded-lg px-3 py-2 text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: bg }}
        >
            {message}
        </div>
    );
}

export default function PrinterPairDialog({ open, onOpenChange, onPairChange }: Props) {
    const [busy, setBusy] = useState<'ble' | 'usb' | null>(null);
    const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const pairedName = getPairedPrinterName();
    const paired = pairedName !== null;

    useEffect(() => {
        if (! toast) {
            return;
        }

        const t = setTimeout(() => setToast(null), 3500);

        return () => clearTimeout(t);
    }, [toast]);

    function showToast(message: string, kind: 'success' | 'error' | 'info' = 'info') {
        setToast({ message, kind });
    }

    async function handlePair(kind: 'bluetooth' | 'usb') {
        setBusy(kind === 'bluetooth' ? 'ble' : 'usb');

        try {
            await pairPrinter(kind);
            const name = getPairedPrinterName();
            setRefreshKey(k => k + 1);
            onPairChange?.(name);
            showToast(`Printer ${kind === 'bluetooth' ? 'Bluetooth' : 'USB'} berhasil di-pair.`, 'success');
        } catch (err) {
            const msg = (err as Error).message;
            showToast(msg ?? 'Gagal pairing printer', 'error');
        } finally {
            setBusy(null);
        }
    }

    function handleUnpair() {
        unpair();
        setRefreshKey(k => k + 1);
        onPairChange?.(null);
        showToast('Printer dilepas. Cetak akan kembali ke dialog sistem.', 'info');
    }

    const bleSupported = isWebBluetoothSupported();
    const usbSupported = isWebUsbSupported();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" style={{ backgroundColor: CREAM }}>
                <DialogTitle className="sr-only">Printer Bluetooth & USB</DialogTitle>

                <div className="space-y-4 p-5" key={refreshKey}>
                    <div className="flex items-center gap-2">
                        <Printer className="size-5" style={{ color: PRIMARY }} />
                        <div>
                            <h2 className="text-base font-bold" style={{ color: INK }}>Printer Bluetooth / USB</h2>
                            <p className="text-xs" style={{ color: MUTED }}>Cetak struk langsung ke printer thermal tanpa dialog sistem</p>
                        </div>
                    </div>

                    <div
                        className="rounded-xl p-3"
                        style={{ backgroundColor: paired ? `${PRIMARY}10` : '#fff', border: `1px solid ${BORDER}` }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Check className="size-4" style={{ color: paired ? PRIMARY : MUTED }} />
                                <div>
                                    <p className="text-xs font-semibold" style={{ color: INK }}>Status</p>
                                    <p className="text-xs" style={{ color: MUTED }}>
                                        {pairedName ? `Terhubung: ${pairedName}` : 'Belum ada printer di-pair'}
                                    </p>
                                </div>
                            </div>
                            {paired && (
                                <button
                                    type="button"
                                    onClick={handleUnpair}
                                    className="rounded-lg p-1.5 transition-colors hover:opacity-70"
                                    style={{ backgroundColor: `${PRIMARY}08` }}
                                    title="Lepas printer"
                                >
                                    <X className="size-4" style={{ color: MUTED }} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => handlePair('bluetooth')}
                            disabled={! bleSupported || busy !== null}
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}
                        >
                            <div className="flex size-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${PRIMARY}12` }}>
                                <Bluetooth className="size-5" style={{ color: PRIMARY }} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold" style={{ color: INK }}>Printer Bluetooth (BLE)</p>
                                <p className="text-xs" style={{ color: MUTED }}>
                                    {bleSupported
                                        ? 'Star Micronics, Epson TM-m30II BLE, dll.'
                                        : 'Tidak didukung browser ini. Gunakan Chrome/Edge di desktop.'}
                                </p>
                            </div>
                            {busy === 'ble' && <Loader2 className="size-4 animate-spin" style={{ color: PRIMARY }} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => handlePair('usb')}
                            disabled={! usbSupported || busy !== null}
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}` }}
                        >
                            <div className="flex size-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${PRIMARY}12` }}>
                                <Cable className="size-5" style={{ color: PRIMARY }} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold" style={{ color: INK }}>Printer USB</p>
                                <p className="text-xs" style={{ color: MUTED }}>
                                    {usbSupported
                                        ? 'Printer USB langsung ke komputer'
                                        : 'Tidak didukung browser ini. Gunakan Chrome/Edge di desktop.'}
                                </p>
                            </div>
                            {busy === 'usb' && <Loader2 className="size-4 animate-spin" style={{ color: PRIMARY }} />}
                        </button>
                    </div>

                    {toast && (
                        <Toast message={toast.message} kind={toast.kind} />
                    )}

                    <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: '#fff', border: `1px solid ${BORDER}`, color: MUTED }}>
                        <p className="font-semibold" style={{ color: INK }}>Catatan</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4">
                            <li>Pairing hanya perlu sekali. Setelah ter-pair, struk otomatis terkirim.</li>
                            <li>Browser Safari iOS tidak mendukung Web Bluetooth/USB — gunakan Chrome di laptop/desktop.</li>
                            <li>Printer Bluetooth Classic SPP (Xprinter XP-58/XP-80) tidak didukung langsung dari browser.</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
import {
    connectAndGetCharacteristic,
    isWebBluetoothSupported,
    pairBluetoothPrinter,
    printViaBle,
} from './blePrinter';
import { getPairedDeviceInfo, setPairedDeviceInfo, clearPairedDeviceInfo } from './deviceStorage';
import { encodeReceipt } from './escposEncoder';
import type { PrintResult, ReceiptData } from './types';
import {
    connectAndGetOutEndpoint,
    isWebUsbSupported,
    pairUsbPrinter,
    printViaUsb,
} from './usbPrinter';
import {
    connectAndGetNativeWriter,
    isNativeBridgeSupported,
    pairNativePrinter,
    printViaNative,
} from './nativePrinter';

export interface OsDialogPrinter {
    printViaOsDialog(iframe: HTMLIFrameElement | null, data: ReceiptData): void;
}

export async function pairPrinter(kind: 'bluetooth' | 'usb' | 'native'): Promise<void> {
    if (kind === 'bluetooth') {
        const device = await pairBluetoothPrinter();
        setPairedDeviceInfo({
            kind: 'bluetooth',
            id: device.id,
            name: device.name ?? 'Bluetooth Printer',
            pairedAt: Date.now(),
        });
    } else if (kind === 'usb') {
        const device = await pairUsbPrinter();
        setPairedDeviceInfo({
            kind: 'usb',
            id: `${device.vendorId}:${device.productId}`,
            name: device.productName ?? `USB Printer (${device.vendorId.toString(16)})`,
            pairedAt: Date.now(),
        });
    } else if (kind === 'native') {
        const info = await pairNativePrinter();
        setPairedDeviceInfo(info);
    }
}

export function getPairedPrinterName(): string | null {
    return getPairedDeviceInfo()?.name ?? null;
}

export function isPaired(): boolean {
    return getPairedDeviceInfo() !== null;
}

export function unpair(): void {
    clearPairedDeviceInfo();
}

export interface PrintReceiptOptions {
    osPrinter: OsDialogPrinter;
    iframeRef: HTMLIFrameElement | null;
    data: ReceiptData;
    charsPerLine?: number;
    openDrawer?: boolean;
}

export async function printReceipt(opts: PrintReceiptOptions): Promise<PrintResult> {
    const { osPrinter, iframeRef, data, charsPerLine = 48, openDrawer = false } = opts;
    const bytes = encodeReceipt(data, charsPerLine, openDrawer);
    const info = getPairedDeviceInfo();

    if (info?.kind === 'bluetooth' && isWebBluetoothSupported()) {
        try {
            const devices = await navigator.bluetooth.getDevices();
            const device = devices.find(d => d.id === info.id);

            if (device) {
                const handle = await connectAndGetCharacteristic(device);

                try {
                    await printViaBle(handle, bytes);
                    handle.cleanup();

                    return { channel: 'ble', success: true };
                } catch (err) {
                    handle.cleanup();

                    throw err;
                }
            }

            console.warn('Paired BLE device not found in authorised devices; falling back.');
            clearPairedDeviceInfo();
        } catch (err) {
            console.warn('BLE print failed, falling back to OS dialog:', err);
        }
    }

    if (info?.kind === 'usb' && isWebUsbSupported()) {
        try {
            const devices = await navigator.usb.getDevices();
            const device = devices.find(d => {
                const expected = info.id.split(':');

                return expected.length === 2
                    && d.vendorId === parseInt(expected[0], 16)
                    && d.productId === parseInt(expected[1], 16);
            });

            if (device) {
                const handle = await connectAndGetOutEndpoint(device);

                try {
                    await printViaUsb(handle, bytes);
                    handle.cleanup();

                    return { channel: 'usb', success: true };
                } catch (err) {
                    handle.cleanup();

                    throw err;
                }
            }

            console.warn('Paired USB device not found in authorised devices; falling back.');
            clearPairedDeviceInfo();
        } catch (err) {
            console.warn('USB print failed, falling back to OS dialog:', err);
        }
    }

    if (info?.kind === 'native' && isNativeBridgeSupported()) {
        try {
            const handle = await connectAndGetNativeWriter(info.id);

            try {
                await printViaNative(handle, bytes);
                handle.cleanup();

                return { channel: 'native', success: true };
            } catch (err) {
                handle.cleanup();

                throw err;
            }
        } catch (err) {
            console.warn('Native print failed, falling back to OS dialog:', err);
        }
    }

    // Fallback: OS print dialog
    try {
        osPrinter.printViaOsDialog(iframeRef, data);

        return { channel: 'os-dialog', success: true };
    } catch (err) {
        return {
            channel: 'os-dialog',
            success: false,
            error: (err as Error).message,
        };
    }
}

export function isAnyDirectPrintSupported(): boolean {
    return isWebBluetoothSupported() || isWebUsbSupported() || isNativeBridgeSupported();
}

export function isOsPrintSupported(): boolean {
    return typeof window !== 'undefined' && typeof window.print === 'function';
}
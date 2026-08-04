// USB vendor IDs of common ESC/POS thermal printer manufacturers.
const KNOWN_USB_VENDORS: { vendorId: number; name: string }[] = [
    { vendorId: 0x04b8, name: 'Epson' },
    { vendorId: 0x0519, name: 'Star Micronics' },
    { vendorId: 0x04f9, name: 'Brother' },
    { vendorId: 0x0fe6, name: 'ICS Advent' },
    { vendorId: 0x1a86, name: 'QinHeng / generic CH340' },
    { vendorId: 0x067b, name: 'Prolific PL2303' },
    { vendorId: 0x10c4, name: 'SiLabs CP210x' },
    { vendorId: 0x0416, name: 'Winbond' },
    { vendorId: 0x0411, name: 'Bixolon' },
    { vendorId: 0x0aa7, name: 'Wasp' },
];

const USB_ENDPOINT_TYPES = {
    bulk: 'bulk',
    interrupt: 'interrupt',
} as const;

export function isWebUsbSupported(): boolean {
    return typeof navigator !== 'undefined' && 'usb' in navigator;
}

export async function pairUsbPrinter(): Promise<USBDevice> {
    if (! isWebUsbSupported()) {
        throw new Error('WebUSB tidak didukung di browser ini');
    }

    const filters = KNOWN_USB_VENDORS.map(v => ({ vendorId: v.vendorId }));

    const device = await navigator.usb.requestDevice({
        filters,
    });

    return device;
}

export interface UsbDeviceHandle {
    device: USBDevice;
    endpointOut: number;
    interfaceNumber: number;
    cleanup: () => void;
}

export async function connectAndGetOutEndpoint(
    device: USBDevice,
): Promise<UsbDeviceHandle> {
    await device.open();

    if (device.configuration === null) {
        await device.selectConfiguration(1);
    }

    const config = device.configuration;

    if (! config) {
        throw new Error('Tidak ada konfigurasi USB yang tersedia');
    }

    const iface = config.interfaces[0];

    if (! iface) {
        throw new Error('Tidak ada interface USB yang tersedia');
    }

    const alternate = iface.alternates[0];

    if (! alternate) {
        throw new Error('Tidak ada alternate setting pada interface');
    }

    const interfaceNumber = iface.interfaceNumber;

    try {
        await device.claimInterface(interfaceNumber);
    } catch (err) {
        throw new Error(`Gagal meng-claim interface USB: ${(err as Error).message}`);
    }

    const endpoint = alternate.endpoints.find(
        ep => ep.direction === 'out' && ep.type === USB_ENDPOINT_TYPES.bulk,
    );

    if (! endpoint || endpoint.endpointNumber === undefined) {
        try {
            await device.releaseInterface(interfaceNumber);
        } catch {
            // ignore
        }

        throw new Error('Tidak ada endpoint bulk OUT pada printer');
    }

    const cleanup = () => {
        try {
            device.close();
        } catch {
            // ignore
        }
    };

    return {
        device,
        endpointOut: endpoint.endpointNumber,
        interfaceNumber,
        cleanup,
    };
}

const USB_CHUNK_SIZE = 64;

export async function printViaUsb(
    handle: UsbDeviceHandle,
    bytes: Uint8Array,
): Promise<void> {
    for (let offset = 0; offset < bytes.length; offset += USB_CHUNK_SIZE) {
        const chunk = bytes.slice(offset, Math.min(offset + USB_CHUNK_SIZE, bytes.length));

        await handle.device.transferOut(handle.endpointOut, chunk);
    }
}
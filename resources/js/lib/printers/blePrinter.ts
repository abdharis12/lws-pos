// Common ESC/POS over BLE GATT service/characteristic UUIDs used by vendor printers.
// We try a list of well-known UUIDs and pick the first characteristic that supports write.

const BLE_SERVICE_UUIDS = [
    '0000ff00-0000-1000-8000-00805f9b34fb', // Generic Chinese ESC/POS BLE (Xprinter, etc.)
    '000018f0-0000-1000-8000-00805f9b34fb', // Vendor-specific
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service
    '38ba0000-49e9-7c9a-9166-9f7e1d2ad8b3', // Some Epson BLE models
    '0000ae00-0000-1000-8000-00805f9b34fb', // Another common generic
    '0000ae30-0000-1000-8000-00805f9b34fb', // Common write characteristic as service
];

const WRITE_CHARACTERISTIC_UUIDS = [
    '0000ff02-0000-1000-8000-00805f9b34fb',
    '0000ae01-0000-1000-8000-00805f9b34fb',
    '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART TX
    '00002af1-0000-1000-8000-00805f9b34fb',
];

const BLE_CHUNK_SIZE = 180;

export function isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export interface BleDeviceHandle {
    device: BluetoothDevice;
    characteristic: BluetoothCharacteristic;
    cleanup: () => void;
}

export async function pairBluetoothPrinter(): Promise<BluetoothDevice> {
    if (! isWebBluetoothSupported()) {
        throw new Error('Web Bluetooth tidak didukung di browser ini');
    }

    const device = await navigator.bluetooth.requestDevice({
        filters: [
            { namePrefix: 'Printer' },
            { namePrefix: 'POS' },
            { namePrefix: 'Xprinter' },
            { namePrefix: 'EPSON' },
            { namePrefix: 'Star' },
            { namePrefix: 'BT' },
            { namePrefix: 'RPP' },
        ],
        optionalServices: BLE_SERVICE_UUIDS,
        acceptAllDevices: true,
    });

    return device;
}

export async function connectAndGetCharacteristic(
    device: BluetoothDevice,
): Promise<BleDeviceHandle> {
    if (! device.gatt) {
        throw new Error('Perangkat tidak mendukung GATT');
    }

    const server = await device.gatt.connect();

    let characteristic: BluetoothCharacteristic | null = null;

    for (const serviceUuid of BLE_SERVICE_UUIDS) {
        try {
            const service = await server.getPrimaryService(serviceUuid);

            for (const charUuid of WRITE_CHARACTERISTIC_UUIDS) {
                try {
                    const ch = await service.getCharacteristic(charUuid);

                    if (ch.properties.write || ch.properties.writeWithoutResponse) {
                        characteristic = ch;
                        break;
                    }
                } catch {
                    // try next
                }
            }

            if (characteristic) {
                break;
            }
        } catch {
            // try next service
        }
    }

    if (! characteristic) {
        server.disconnect();

        throw new Error(
            'Tidak dapat menemukan characteristic tulis ESC/POS pada printer. Pastikan printer mendukung BLE ESC/POS (bukan Bluetooth Classic SPP).',
        );
    }

    const cleanup = () => {
        try {
            server.disconnect();
        } catch {
            // ignore
        }
    };

    return { device, characteristic, cleanup };
}

export async function printViaBle(
    handle: BleDeviceHandle,
    bytes: Uint8Array,
): Promise<void> {
    const supportsWriteWithoutResponse = handle.characteristic.properties.writeWithoutResponse;

    for (let offset = 0; offset < bytes.length; offset += BLE_CHUNK_SIZE) {
        const chunk = bytes.slice(offset, Math.min(offset + BLE_CHUNK_SIZE, bytes.length));

        if (supportsWriteWithoutResponse) {
            await handle.characteristic.writeValueWithoutResponse(chunk);
        } else {
            await handle.characteristic.writeValue(chunk);
        }

        // Small delay between chunks to let the printer's buffer drain.
        await new Promise(resolve => setTimeout(resolve, 25));
    }
}
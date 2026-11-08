/**
 * Native Printer Bridge for Bluetooth Classic (SPP) printers.
 *
 * Starts a WebSocket server on ws://127.0.0.1:12345 that speaks the
 * protocol defined in resources/js/lib/printers/nativePrinter.ts
 *
 *   client -> bridge : {"type":"pair"}
 *   bridge -> client : {"type":"paired","deviceId":"...","name":"..."}
 *   client -> bridge : {"type":"print","deviceId":"..."}
 *   client -> bridge : <binary ESC/POS bytes>
 *   bridge -> client : {"type":"ok"} | {"type":"error","message":"..."}
 *
 * Run with: npm run printer:bridge
 */

import { WebSocketServer } from 'ws';
import { BluetoothSerialPort as BTSerial } from 'bluetooth-serial-port';

const PORT = 12345;
const wss = new WebSocketServer({ host: '127.0.0.1', port: PORT });

/** @type {{ address: string, name: string } | null} */
let pairedDevice = null;

/**
 * One Bluetooth SPP connection persisted for the lifetime of the bridge.
 * The browser may open a new WebSocket for every print; keeping the RFCOMM
 * socket open avoids re-pairing on every receipt.
 */
/** @type {import('bluetooth-serial-port').BluetoothSerialPort | null} */
let activeSerial = null;
let activeAddress = null;

/** @type {WebSocket | null} */
let printClient = null;

function getOrCreateSerial(address) {
    if (activeSerial && activeAddress === address) {
        return Promise.resolve(activeSerial);
    }

    if (activeSerial) {
        try {
            activeSerial.close();
        } catch {
            // ignore
        }
        activeSerial = null;
        activeAddress = null;
    }

    return new Promise((resolve, reject) => {
        const serial = new BTSerial();
        const timer = setTimeout(() => {
            reject(new Error(`Timeout connecting to ${address}`));
        }, 10_000);

        serial.connect(
            address,
            1,
            () => {
                clearTimeout(timer);
                activeSerial = serial;
                activeAddress = address;
                resolve(serial);
            },
            (err) => {
                clearTimeout(timer);
                reject(new Error(`Failed to connect to ${address}: ${err?.message ?? err}`));
            },
        );
    });
}

function listPairedDevices() {
    return new Promise((resolve, reject) => {
        const serial = new BTSerial();
        serial.listPairedDevices((err, devices) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(devices ?? []);
        });
    });
}

async function handlePair(ws) {
    try {
        const devices = await listPairedDevices();
        console.log('[Printer Bridge] Paired Bluetooth devices:', devices);

        const printerDevices = devices.filter((d) =>
            /printer|pos|xprinter|epson|star|thermal|rpp|bt[-_ ]?5/i.test(d.name ?? ''),
        );

        const device = printerDevices[0] ?? devices[0];

        if (! device) {
            ws.send(
                JSON.stringify({
                    type: 'error',
                    message:
                        'Tidak ada printer Bluetooth yang sudah di-pair. Pair dulu printer di pengaturan Bluetooth OS.',
                }),
            );
            return;
        }

        await getOrCreateSerial(device.address);
        pairedDevice = { address: device.address, name: device.name ?? device.address };

        console.log('[Printer Bridge] Paired:', pairedDevice);

        ws.send(
            JSON.stringify({
                type: 'paired',
                deviceId: pairedDevice.address,
                name: pairedDevice.name,
            }),
        );
    } catch (err) {
        console.error('[Printer Bridge] Pair failed:', err);
        ws.send(JSON.stringify({ type: 'error', message: err.message ?? 'Pairing gagal' }));
    }
}

async function handlePrint(ws, deviceId) {
    try {
        const address = deviceId === 'native-spp' ? pairedDevice?.address : deviceId;

        if (! address) {
            ws.send(
                JSON.stringify({
                    type: 'error',
                    message: 'Printer belum di-pair. Lakukan pairing terlebih dahulu.',
                }),
            );
            return;
        }

        await getOrCreateSerial(address);
        printClient = ws;
        ws.send(JSON.stringify({ type: 'ready' }));
    } catch (err) {
        console.error('[Printer Bridge] Print init failed:', err);
        ws.send(JSON.stringify({ type: 'error', message: err.message ?? 'Gagal menyiapkan printer' }));
    }
}

function handlePrintData(ws, data) {
    if (! activeSerial || printClient !== ws) {
        return;
    }

    activeSerial.write(data, (err, bytesWritten) => {
        if (err) {
            console.error('[Printer Bridge] Write error:', err);
            ws.send(JSON.stringify({ type: 'error', message: `Write failed: ${err.message}` }));
            return;
        }

        console.log(`[Printer Bridge] Written ${bytesWritten} bytes`);
        ws.send(JSON.stringify({ type: 'ok' }));
    });
}

wss.on('connection', (ws) => {
    console.log('[Printer Bridge] Client connected');
    /** @type {'idle' | 'printing'} */
    let state = 'idle';

    ws.on('message', (data, isBinary) => {
        if (isBinary) {
            handlePrintData(ws, data);
            return;
        }

        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch {
            return;
        }

        switch (msg.type) {
            case 'pair':
                handlePair(ws);
                break;
            case 'print':
                state = 'printing';
                handlePrint(ws, msg.deviceId);
                break;
            default:
                ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
        }
    });

    ws.on('close', () => {
        console.log('[Printer Bridge] Client disconnected');
        if (printClient === ws) {
            printClient = null;
        }
    });

    ws.on('error', (err) => {
        console.error('[Printer Bridge] WebSocket error:', err.message);
    });
});

process.on('SIGINT', () => {
    console.log('\n[Printer Bridge] Shutting down...');
    if (activeSerial) {
        try {
            activeSerial.close();
        } catch {
            // ignore
        }
    }
    wss.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
    console.error('[Printer Bridge] Uncaught exception:', err);
});

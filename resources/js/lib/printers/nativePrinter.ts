// Native Bridge (Bluetooth Classic / SPP) transport.
//
// Browsers cannot open an RFCOMM/SPP socket, so SPP printers must be driven by a
// small helper process running on the same machine. This module talks to that
// helper over WebSocket, or through a `window.nativePrinterBridge` object when the
// app is wrapped in a desktop shell (Electron / Capacitor / Tauri).
//
// Bridge protocol (WebSocket, default ws://127.0.0.1:12345):
//
//   client -> bridge : {"type":"pair"}
//   bridge -> client : {"type":"paired","deviceId":"...","name":"..."}
//   client -> bridge : {"type":"print","deviceId":"..."}
//   client -> bridge : <binary ESC/POS bytes>
//   bridge -> client : {"type":"ok"} | {"type":"error","message":"..."}
//
// The bridge is intentionally thin: it owns the Bluetooth pairing and the RFCOMM
// socket, the browser owns receipt layout and ESC/POS encoding.

const DEFAULT_BRIDGE_URL = 'ws://127.0.0.1:12345';
const PAIR_TIMEOUT_MS = 60_000;

export interface NativeWriterHandle {
    write(bytes: Uint8Array): Promise<void>;
    cleanup(): void;
}

interface BridgeMessage {
    type: string;
    deviceId?: string;
    name?: string;
    message?: string;
}

function getBridgeUrl(): string {
    if (typeof window !== 'undefined' && window.__LWS_NATIVE_BRIDGE_URL__) {
        return window.__LWS_NATIVE_BRIDGE_URL__;
    }

    return DEFAULT_BRIDGE_URL;
}

function hasNativeBridgeObject(): boolean {
    return typeof window !== 'undefined' && typeof window.nativePrinterBridge !== 'undefined';
}

function hasWebSocket(): boolean {
    return typeof window !== 'undefined' && typeof window.WebSocket === 'function';
}

export function isNativeBridgeSupported(): boolean {
    return hasNativeBridgeObject() || hasWebSocket();
}

function openSocket(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        let ws: WebSocket;

        try {
            ws = new WebSocket(getBridgeUrl());
        } catch (err) {
            reject(
                new Error(
                    `Tidak dapat membuka native bridge di ${getBridgeUrl()}. Pastikan helper SPP sudah berjalan.`,
                ),
            );

            return;
        }

        const timer = setTimeout(() => {
            ws.close();
            reject(new Error('Native bridge tidak merespons (timeout). Pastikan helper SPP sudah berjalan.'));
        }, PAIR_TIMEOUT_MS);

        ws.onopen = () => {
            clearTimeout(timer);
            resolve(ws);
        };

        ws.onerror = () => {
            clearTimeout(timer);
            reject(
                new Error(
                    `Native bridge tidak ditemukan di ${getBridgeUrl()}. Jalankan helper printer (SPP) lalu coba lagi.`,
                ),
            );
        };
    });
}

function waitForMessage(ws: WebSocket, predicate: (msg: BridgeMessage) => boolean): Promise<BridgeMessage> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error('Native bridge tidak merespons (timeout).'));
        }, PAIR_TIMEOUT_MS);

        function cleanup() {
            clearTimeout(timer);
            ws.removeEventListener('message', onMessage);
            ws.removeEventListener('close', onClose);
            ws.removeEventListener('error', onError);
        }

        function onMessage(event: MessageEvent) {
            let msg: BridgeMessage;

            try {
                msg = JSON.parse(String(event.data)) as BridgeMessage;
            } catch {
                return;
            }

            if (msg.type === 'error') {
                cleanup();
                reject(new Error(msg.message ?? 'Native bridge melaporkan error.'));

                return;
            }

            if (predicate(msg)) {
                cleanup();
                resolve(msg);
            }
        }

        function onClose() {
            cleanup();
            reject(new Error('Koneksi ke native bridge terputus.'));
        }

        function onError() {
            cleanup();
            reject(new Error('Koneksi ke native bridge gagal.'));
        }

        ws.addEventListener('message', onMessage);
        ws.addEventListener('close', onClose);
        ws.addEventListener('error', onError);
    });
}

export async function pairNativePrinter(): Promise<{ id: string; name: string }> {
    if (! isNativeBridgeSupported()) {
        throw new Error('Native bridge tidak tersedia di browser ini.');
    }

    if (hasNativeBridgeObject() && window.nativePrinterBridge?.requestPair) {
        const device = await window.nativePrinterBridge.requestPair();

        return { id: device.id, name: device.name };
    }

    const ws = await openSocket();
    const paired = waitForMessage(ws, msg => msg.type === 'paired');

    ws.send(JSON.stringify({ type: 'pair' }));

    try {
        const msg = await paired;

        return {
            id: msg.deviceId ?? 'native-spp',
            name: msg.name ?? 'Printer Bluetooth (SPP)',
        };
    } finally {
        ws.close();
    }
}

export async function connectAndGetNativeWriter(deviceId: string): Promise<NativeWriterHandle> {
    if (hasNativeBridgeObject() && window.nativePrinterBridge?.writeToDevice) {
        const bridge = window.nativePrinterBridge;

        return {
            write: (bytes) => bridge.writeToDevice!(deviceId, bytes.buffer as ArrayBuffer),
            cleanup: () => bridge.releaseDevice?.(deviceId),
        };
    }

    const ws = await openSocket();

    if (ws.readyState !== WebSocket.OPEN) {
        throw new Error('Koneksi ke native bridge belum siap.');
    }

    return {
        write: async (bytes) => {
            const ack = waitForMessage(ws, msg => msg.type === 'ok');

            ws.send(JSON.stringify({ type: 'print', deviceId }));
            ws.send(bytes);

            await ack;
        },
        cleanup: () => {
            try {
                ws.close();
            } catch {
                // ignore
            }
        },
    };
}

export async function printViaNative(handle: NativeWriterHandle, bytes: Uint8Array): Promise<void> {
    await handle.write(bytes);
}

declare global {
    interface Window {
        __LWS_NATIVE_BRIDGE_URL__?: string;
        nativePrinterBridge?: {
            requestPair?(): Promise<{ id: string; name: string }>;
            writeToDevice?(deviceId: string, data: ArrayBuffer): Promise<void>;
            releaseDevice?(deviceId: string): void;
        };
    }
}

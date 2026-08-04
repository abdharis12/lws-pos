import type { PairedDeviceInfo } from './types';

const STORAGE_KEY = 'lws.printer.paired';

function isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getPairedDeviceInfo(): PairedDeviceInfo | null {
    if (! isBrowser()) {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (! raw) {
            return null;
        }

        return JSON.parse(raw) as PairedDeviceInfo;
    } catch {
        return null;
    }
}

export function setPairedDeviceInfo(info: PairedDeviceInfo): void {
    if (! isBrowser()) {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
}

export function clearPairedDeviceInfo(): void {
    if (! isBrowser()) {
        return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
}
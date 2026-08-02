export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                updateViaCache: 'no-cache',
            });

            registration.update().catch(() => {});

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (navigator.serviceWorker.controller) {
                    window.location.reload();
                }
            });
        } catch (e) {
            console.warn('ServiceWorker registration failed:', e);
        }
    });
}

export async function unregisterAllServiceWorkers() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();

    await Promise.all(registrations.map((r) => r.unregister()));

    if ('caches' in window) {
        const keys = await caches.keys();

        await Promise.all(keys.map((k) => caches.delete(k)));
    }
}

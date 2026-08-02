const CACHE_NAME = 'bubur-kang-lw-v3';

const PRECACHE_URLS = [
    '/offline',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        )
    );
    self.clients.claim();
});

function isCacheableRequest(request) {
    if (request.method !== 'GET') {
        return false;
    }

    let url;
    try {
        url = new URL(request.url);
    } catch {
        return false;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
    }

    if (request.headers.has('range')) {
        return false;
    }

    return true;
}

function isInertiaRequest(request) {
    return request.headers.get('x-inertia') === 'true'
        || (request.headers.get('accept') || '').includes('text/html')
        || request.headers.get('x-requested-with') === 'XMLHttpRequest';
}

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    if (event.request.mode === 'navigate' || isInertiaRequest(event.request)) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, copy).catch(() => {});
                        });
                    }

                    return response;
                })
                .catch(() => {
                    if (event.request.mode === 'navigate') {
                        return caches.match('/offline');
                    }

                    return new Response('', { status: 503, statusText: 'Offline' });
                })
        );

        return;
    }

    if (!isCacheableRequest(event.request)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                return cached;
            }

            return fetch(event.request)
                .then((response) => {
                    if (
                        !response ||
                        response.status !== 200 ||
                        response.type !== 'basic' ||
                        !isCacheableRequest(event.request)
                    ) {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache).catch(() => {});
                    });

                    return response;
                })
                .catch(() => {
                    if (event.request.destination === 'image') {
                        return caches.match('/img/placeholder.png');
                    }
                    return null;
                });
        })
    );
});

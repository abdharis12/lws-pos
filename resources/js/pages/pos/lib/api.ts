export function getCsrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (meta) return meta;
    const cookie = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='));
    if (cookie) return decodeURIComponent(cookie.split('=')[1]);
    return '';
}

export function jsonHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken(),
    };
}

export async function posFetch(url: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
        ...options,
        headers: {
            ...jsonHeaders(),
            ...(options.headers as Record<string, string> ?? {}),
        },
    });
}

export async function posFetchJson<T = unknown>(url: string, options: RequestInit = {}): Promise<{ ok: boolean; data: T }> {
    const res = await posFetch(url, options);
    const data = await res.json().catch(() => ({} as T));
    return { ok: res.ok, data };
}

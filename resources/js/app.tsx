import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const broadcastConnection =
    import.meta.env.VITE_BROADCAST_CONNECTION ??
    (import.meta.env.VITE_REVERB_APP_KEY ? 'reverb' : 'null');

const reverbEnabled =
    broadcastConnection === 'reverb' && Boolean(import.meta.env.VITE_REVERB_APP_KEY);

const reverbScheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';
const useTLS = reverbScheme === 'https';

configureEcho({
    broadcaster: reverbEnabled ? 'reverb' : 'null',
    forceTLS: useTLS,
    enabledTransports: useTLS ? ['wss'] : ['ws'],
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('self-order/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Register service worker for PWA
if (import.meta.env.PROD) {
    import('@/sw-register').then(({ registerServiceWorker }) => {
        registerServiceWorker();
    });
}

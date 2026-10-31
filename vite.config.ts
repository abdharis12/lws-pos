import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

const radixPackages = [
    '@radix-ui/react-avatar',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-collapsible',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-navigation-menu',
    '@radix-ui/react-select',
    '@radix-ui/react-separator',
    '@radix-ui/react-slot',
    '@radix-ui/react-toggle',
    '@radix-ui/react-toggle-group',
    '@radix-ui/react-tooltip',
];

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia({ ssr: false }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
            command:
                process.env.WAYFINDER_GENERATE_COMMAND ??
                'php artisan wayfinder:generate',
        }),
    ],

    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules/react')) return 'vendor';
                    if (id.includes('node_modules/react-dom')) return 'vendor';
                    for (const pkg of radixPackages) {
                        if (id.includes(`node_modules/@radix-ui/${pkg.split('/')[1]}`)) return 'radix';
                    }
                },
            },
        },
    },
});
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const radixPackages = readdirSync(
    join(process.cwd(), 'node_modules', '@radix-ui'),
    { withFileTypes: true }
)
    .filter((d) => d.isDirectory() && d.name.startsWith('react-'))
    .map((d) => `@radix-ui/${d.name}`);

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

    server: {
        host: '0.0.0.0',
        port: 5173,

        watch: {
            ignored: ['**/node_modules/**', '**/public/build/**', '**/public/hot'],
        },

        hmr: {
            host: 'localhost',
        },
    },

    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    radix: radixPackages,
                },
            },
        },
    },
});

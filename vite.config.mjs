import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import Components from 'unplugin-vue-components/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    optimizeDeps: {
        noDiscovery: true
    },
    plugins: [
        nodePolyfills({
            // Specify polyfills for Node.js built-in modules
            globals: {
                crypto: true
                //buffer: true,
                //stream: true
            }
        }),
        vue(),
        vueJsx(),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            crypto: 'crypto-browserify'
        }
    }
});

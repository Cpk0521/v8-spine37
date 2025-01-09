import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
    server: {
        open: '/playground/index.html',
    },
    build: {
        emptyOutDir: false,
        lib: {
            formats : ['es', 'umd', 'iife'], // 'es' | 'cjs' | 'umd' | 'iife'
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'PIXI.Spine37',
            fileName: (format) => `v8-spine37${format === 'umd' ? '' : '.'+format}.js`
        },
        rollupOptions: {
            external(id, parentId, isResolved) {
                return id.startsWith('@pixi/') || id === 'pixi.js';
            },
            output: {
                extend: true,
                globals(id: string) {
                    if (id.startsWith('@pixi/') || id === 'pixi.js') {
                        return require(`./node_modules/${id}/package.json`).namespace || 'PIXI';
                    }
                },
            },
        },
        minify: false,
    },
    plugins: [dts()]
})
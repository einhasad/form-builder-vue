import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

/**
 * Dedicated config for the public demo site (GitHub Pages).
 *
 * Keeps the library build (`vite.config.ts`, `lib: { ... }`) separate so
 * we can keep a Vite app-mode build here with its own entry (`index.html`)
 * and output dir (`demo-dist`).
 */
export default defineConfig(() => ({
  plugins: [vue()],
  base: process.env['VITE_DEMO_BASE'] ?? '/',
  resolve: {
    alias: {
      // Inside the demo, `@einhasad-vue/form-builder-vue` resolves to the
      // local source so the demo always shows the latest code, not the
      // last-published npm tarball.
      '@einhasad-vue/form-builder-vue': resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    outDir: 'demo-dist',
    emptyOutDir: true,
    sourcemap: true,
  },
}))

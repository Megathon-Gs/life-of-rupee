import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults, defineConfig } from 'vitest/config'

// Regexes and the cache name are duplicated in src/platform/pwa/assets.ts; keep in sync.
const API_PATH_PATTERN = /^\/(api|sync|educator)\//
const ASSET_CACHE = 'paisa-assets'

// Vite + Vitest share this config. `defineConfig` comes from `vitest/config` so the
// `test` block is typed; Vitest is a dev dependency and safe to reference from the build.
export default defineConfig({
  plugins: [
    react(),
    // Offline: precache the shell, fonts and the first level; a waiting update is applied
    // only on explicit user action (src/platform/pwa). API responses are never cached.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Lifeof₹',
        short_name: 'Lifeof₹',
        description: 'Offline-first financial literacy game',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f7f1e3',
        theme_color: '#1f6f5c',
      },
      workbox: {
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: [
          '**/*.{js,css,html,woff2}',
          'assets/manifest.json',
          'assets/urban.*.png',
          'interiors/bank.png',
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [API_PATH_PATTERN],
        runtimeCaching: [
          {
            // Sync and educator calls (and anything cross-origin) stay entirely out of cache.
            // Inlined: Workbox serialises this function into the worker, so it cannot close
            // over imports.
            urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
              !sameOrigin || /^\/(api|sync|educator)\//.test(url.pathname),
            handler: 'NetworkOnly',
          },
          {
            // Later levels' chunks, atlases and backdrops: cached on first visit, served offline after.
            urlPattern: /\/(assets|interiors)\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: ASSET_CACHE },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Keep the shared runner from starving the accessibility scans.
    maxWorkers: 2,
    environment: 'jsdom',
    passWithNoTests: true,
    exclude: [...configDefaults.exclude, 'tests/e2e/**', 'tests/visual/**'],
  },
})

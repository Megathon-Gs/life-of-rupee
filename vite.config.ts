import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// Vite + Vitest share this config. `defineConfig` comes from `vitest/config` so the
// `test` block is typed; Vitest is a dev dependency and safe to reference from the build.
export default defineConfig({
  plugins: [react()],
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
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
})

import { defineConfig } from '@playwright/test'

/**
 * Real-browser checks for the UI gallery (layout, contrast, tap targets, Telugu
 * clipping). Not part of `pnpm test`: run with
 *   pnpm exec playwright test -c src/ui/dev/playwright.gallery.config.ts
 * Set GALLERY_SHOTS=<dir> to also write the evidence screenshots.
 */
const port = 5198

export default defineConfig({
  testDir: '.',
  testMatch: '*.pw.ts',
  reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `pnpm exec vite --port ${port} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${port}/src/ui/dev/gallery.html`,
    cwd: '../../..',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})

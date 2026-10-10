import { defineConfig, type PlaywrightTestConfig } from '@playwright/test'
import base from '../../playwright.config'

/**
 * Visual-regression config (P0-23). The root config's testDir is ./tests/e2e and is frozen,
 * so this extends it with testDir pointed here. Run from the repo root:
 *   pnpm exec playwright test -c tests/visual/playwright.config.ts
 *   pnpm exec playwright test -c tests/visual/playwright.config.ts --update-snapshots
 * Set CI=1 and E2E_PORT=<free port> to run the preview server on a port of your choice.
 *
 * The skill tree has no route in the running app yet, so its baseline is taken from the
 * UI gallery served by a Vite dev server on VISUAL_GALLERY_PORT (default 5197).
 */
const galleryPort = Number(process.env.VISUAL_GALLERY_PORT ?? 5197)

const appServers = [base.webServer ?? []].flat().map((server) => ({ ...server, cwd: '../..' }))

const config: PlaywrightTestConfig = {
  ...base,
  testDir: '.',
  testMatch: '*.spec.ts',
  // Baselines are generated and compared on the same machine class; a single worker and
  // no parallelism keeps rendering identical between the create and compare runs.
  fullyParallel: false,
  workers: 1,
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.002 },
  },
  webServer: [
    ...appServers,
    {
      command: `pnpm exec vite --port ${galleryPort} --strictPort --host 127.0.0.1`,
      cwd: '../..',
      url: `http://127.0.0.1:${galleryPort}/src/ui/dev/gallery.html`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
}

export default defineConfig(config)

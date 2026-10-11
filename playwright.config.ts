import { defineConfig, devices } from '@playwright/test'

const webPort = Number(process.env.E2E_PORT ?? 4173)
const baseURL = `http://127.0.0.1:${webPort}`
// Concurrent runs must not share artifacts: a run on a custom E2E_PORT gets its own
// output dir (override with E2E_OUTPUT_DIR). Plain `pnpm e2e` keeps `test-results`.
const outputDir =
  process.env.E2E_OUTPUT_DIR ??
  (process.env.E2E_PORT ? `test-results-${webPort}` : 'test-results')

export default defineConfig({
  testDir: './tests/e2e',
  outputDir,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'phone-small',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 740 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 10; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
    },
    {
      name: 'phone-large',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // In CI: a dedicated port, strictPort (fail if taken), and never reuse a foreign
    // server. Locally: reuse a dev/preview server on the default port for speed.
    command: process.env.CI
      ? `pnpm build && pnpm preview --host 127.0.0.1 --port ${webPort} --strictPort`
      : 'pnpm build && pnpm preview --host 127.0.0.1',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

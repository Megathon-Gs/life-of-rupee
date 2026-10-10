import { defineConfig, devices } from '@playwright/test'
import { createServer } from 'node:net'

// CI shares this VM with worktrees; never reuse another checkout's preview server.
const port = process.env.PAISA_E2E_PORT
  ? Number(process.env.PAISA_E2E_PORT)
  : process.env.CI
    ? await new Promise<number>((resolve, reject) => {
        const server = createServer()
        server.on('error', reject)
        server.listen(0, '127.0.0.1', () => {
          const address = server.address()
          if (!address || typeof address === 'string') {
            server.close()
            reject(new Error('Could not allocate a preview port'))
            return
          }
          server.close((error) => (error ? reject(error) : resolve(address.port)))
        })
      })
    : 4173
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid preview port')
// Playwright workers reload this config and must inherit the parent's allocated port.
process.env.PAISA_E2E_PORT = String(port)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
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
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

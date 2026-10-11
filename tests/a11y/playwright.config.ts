import base from '../../playwright.config'
import { defineConfig } from '@playwright/test'

/** Root config only scans tests/e2e; this reuses it for tests/a11y (run `pnpm e2e -c tests/a11y/playwright.config.ts`). */
export default defineConfig({ ...base, testDir: '.' })

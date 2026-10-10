import { expect, test } from '../privacy/network-allowlist'

test('loads the app without contacting another origin', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})

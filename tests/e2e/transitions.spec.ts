import type { Page } from '@playwright/test'
import { expect, test } from '../privacy/network-allowlist'

const band = (page: Page) => page.getByTestId('world-band')

async function arrive(page: Page, deterministic = false) {
  await page.goto(deterministic ? '/?test=1' : '/')
  await page.getByTestId('profile-new').click()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await expect(page.getByTestId('door-cue')).toBeFocused()
}

/** Measure inside the browser so driver round trips are not part of the timing budget. */
async function timedEntry(page: Page): Promise<number> {
  return page.getByTestId('door-cue').evaluate(
    (door) =>
      new Promise<number>((resolve) => {
        const start = performance.now()
        const band = document.querySelector('[data-testid="world-band"]')!
        const observer = new MutationObserver(() => {
          if (band.getAttribute('data-transitioning') === 'false') {
            observer.disconnect()
            resolve(performance.now() - start)
          }
        })
        observer.observe(band, { attributes: true, attributeFilter: ['data-transitioning'] })
        ;(door as HTMLElement).click()
      }),
  )
}

test('first entry completes within 1.2 s; repeat entry can Skip and survives reload', async ({
  page,
}) => {
  await arrive(page)
  expect(await timedEntry(page)).toBeLessThanOrEqual(1200)
  await expect(page.getByRole('button', { name: 'Skip entry animation' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByTestId('door-cue')).toBeFocused()
  await page.keyboard.press('Enter')
  const skip = page.getByRole('button', { name: 'Skip entry animation' })
  await expect(skip).toBeVisible()
  expect(
    await skip.evaluate((button) => getComputedStyle(button.closest('[role="dialog"]')!).opacity),
  ).toBe('1')
  await skip.click()
  await expect(page.getByRole('button', { name: 'Close', exact: true })).toBeFocused()
  await expect(band(page)).toHaveAttribute('data-transitioning', 'false')
  await expect(page.getByTestId('bank-transition-proxy')).toHaveCount(0)
  await page.reload()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await page.getByTestId('door-cue').click()
  await skip.click()
  await expect(page.getByTestId('bank-transition-proxy')).toHaveCount(0)
})

test('reduced-motion entry has no proxy and completes within 200 ms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await arrive(page)
  expect(await timedEntry(page)).toBeLessThanOrEqual(200)
  await expect(page.getByTestId('bank-transition-proxy')).toHaveCount(0)
})

test('closing during entry cleans up and unlocks travel', async ({ page }) => {
  await arrive(page)
  await page.getByTestId('door-cue').click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByTestId('bank-transition-proxy')).toHaveCount(0)
  await expect(band(page)).not.toHaveAttribute('inert', '')
  await page.keyboard.press('ArrowRight')
  await expect(band(page)).toHaveAttribute('data-location', 'kirana')
})

test('bank entry end state matches its viewport reference', async ({ page }) => {
  await arrive(page, true)
  await page.keyboard.press('Enter')
  await expect(band(page)).toHaveAttribute('data-transitioning', 'false')
  await expect(page.getByRole('dialog')).toBeVisible()
  const dialogue = page.getByRole('region', { name: /Street guide/ })
  const dialogueRect = await dialogue.boundingBox()
  const panelRect = await page.getByRole('dialog').boundingBox()
  expect(dialogueRect!.x).toBeGreaterThanOrEqual(panelRect!.x)
  expect(dialogueRect!.x + dialogueRect!.width).toBeLessThanOrEqual(panelRect!.x + panelRect!.width)
  await expect(page).toHaveScreenshot('bank-entry.png', { animations: 'disabled' })
})

test('a new local player does not inherit another player’s seen transition', async ({ page }) => {
  await arrive(page)
  await page.keyboard.press('Enter')
  await expect(band(page)).toHaveAttribute('data-transitioning', 'false')
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByTestId('profile-switch').click()
  await page.getByTestId('profile-new').click()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByTestId('skip-transition')).toHaveCount(0)
  await expect(band(page)).toHaveAttribute('data-transitioning', 'false')
})

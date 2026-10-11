import { expect, type Page } from '@playwright/test'

/** Fixtures-only test mode: one short bank level, deterministic steps. */
export const OFFLINE_URL = '/?test=1&fixtures=only'
/** Real content in test mode: L2 at the bank, L4/L5 at the phone shop. */
export const REAL_URL = '/?test=1'
/** Same as OFFLINE_URL plus the PWA test seam (window.__paisaPwa). */
export const PWA_TEST_URL = '/?test=1&fixtures=only&pwaTest=1'

export const band = (page: Page) => page.getByTestId('world-band')
export const step = (page: Page) => page.getByTestId('level-step')
export const results = (page: Page) => page.getByTestId('results')
export const updateToast = (page: Page) => page.getByTestId('pwa-update')

/** Waits until the worker controls this page and the lazy atlas cache is warm. */
export async function waitForOfflineReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return (
      navigator.serviceWorker.controller?.state === 'activated' &&
      document.documentElement.dataset.pwaAssets === 'ready'
    )
  })
}

export async function startNewProfile(page: Page): Promise<void> {
  await page.getByTestId('profile-new').click()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(band(page)).toHaveAttribute('data-location', 'home')
}

/** Steps east until the protagonist stands at `id`; never skips a building. */
export async function travelTo(page: Page, id: string): Promise<void> {
  for (let guard = 0; guard < 12; guard += 1) {
    const at = await band(page).getAttribute('data-location')
    if (at === id) return
    await expect(band(page)).toHaveAttribute('data-travelling', 'false')
    await page.keyboard.press('ArrowRight')
    await expect(band(page)).not.toHaveAttribute('data-location', at ?? '')
  }
  await expect(band(page)).toHaveAttribute('data-location', id)
}

export async function openDoor(page: Page): Promise<void> {
  const door = page.getByTestId('door-cue')
  await expect(door).toBeVisible()
  await door.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(step(page)).toBeVisible()
}

const INTERACTION_STEPS = ['lesson', 'decision', 'transfer']

/** Answers the open interaction by trying each option until it is accepted. */
async function completeInteraction(page: Page, type: string): Promise<void> {
  const panel = step(page)
  // A vanished panel (results screen) counts as advanced; never block on the attribute.
  const advanced = async () => {
    if ((await panel.count()) === 0 || !(await panel.isVisible())) return true
    return (await step(page).getAttribute('data-step-type')) !== type
  }
  const fieldsets = panel.locator('fieldset')
  if ((await fieldsets.count()) > 0) {
    for (let i = 0; i < (await fieldsets.count()); i += 1) {
      if (await advanced()) return
      const field = fieldsets.nth(i)
      const options = field.locator('button[aria-pressed]')
      for (let j = 0; j < (await options.count()); j += 1) {
        if ((await field.locator('button[aria-pressed="true"]').count()) > 0) break
        await options.nth(j).click()
        if (await advanced()) return
      }
    }
    return
  }
  const options = panel.locator('button[aria-pressed]')
  for (let j = 0; j < (await options.count()); j += 1) {
    await options.nth(j).click()
    if (await advanced()) return
  }
}

/** Walks every step of the open level until the results screen shows. */
export async function playLevel(page: Page): Promise<void> {
  for (let guard = 0; guard < 40; guard += 1) {
    if (await results(page).isVisible()) return
    if ((await step(page).count()) === 0) {
      await page.waitForTimeout(100)
      continue
    }
    const type = await step(page).getAttribute('data-step-type')
    if (type === 'hook' || type === 'consequence') {
      await step(page)
        .getByRole('button', { name: /^(Continue|Done)$/ })
        .click()
    } else if (type && INTERACTION_STEPS.includes(type)) {
      await completeInteraction(page, type)
    } else {
      await page.waitForTimeout(100)
    }
  }
  await expect(results(page)).toBeVisible()
}

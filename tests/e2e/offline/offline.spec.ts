import { expect, test } from '@playwright/test'
import {
  OFFLINE_URL,
  PWA_TEST_URL,
  REAL_URL,
  band,
  openDoor,
  playLevel,
  results,
  startNewProfile,
  step,
  travelTo,
  updateToast,
  waitForOfflineReady,
} from './pwa'

type PwaWindow = Window & { __paisaPwa?: { simulateUpdateReady(): void }; pwaSentinel?: string }

test('shell and the first level play after one load, then offline', async ({ page, context }) => {
  await page.goto(OFFLINE_URL)
  await startNewProfile(page)
  await waitForOfflineReady(page)

  await context.setOffline(true)
  await page.reload()

  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(page.getByTestId('profile-picker')).toHaveCount(0)
  await travelTo(page, 'bank')
  await openDoor(page)
  await expect(page.getByTestId('interior-backdrop').locator('img')).toHaveJSProperty(
    'naturalWidth',
    384,
  )
  await playLevel(page)
  await expect(results(page)).toBeVisible()
})

test('a level visited once online reopens offline', async ({ page, context }) => {
  await page.goto(REAL_URL)
  await startNewProfile(page)
  await waitForOfflineReady(page)

  await travelTo(page, 'phone-shop')
  await openDoor(page)
  await expect(step(page)).toBeVisible()
  expect(await step(page).getAttribute('data-step-type')).toBeTruthy()
  await expect(page.getByTestId('interior-backdrop').locator('img')).toHaveJSProperty(
    'naturalWidth',
    384,
  )

  await context.setOffline(true)
  await page.reload()

  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(band(page)).toHaveAttribute('data-location', 'phone-shop')
  await openDoor(page)
  await expect(step(page)).toBeVisible()
  await expect(page.getByTestId('interior-backdrop').locator('img')).toHaveJSProperty(
    'naturalWidth',
    384,
  )
})

test('a deploy mid-level does not reload the page until the level ends', async ({ page }) => {
  await page.goto(PWA_TEST_URL)
  await startNewProfile(page)
  await waitForOfflineReady(page)
  await travelTo(page, 'bank')
  await openDoor(page)

  await page.evaluate(() => {
    const w = window as PwaWindow
    w.pwaSentinel = 'alive'
    w.__paisaPwa?.simulateUpdateReady()
  })

  // Mid-level: the offer is withheld and nothing reloads.
  await expect(updateToast(page)).toBeHidden()
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => (window as PwaWindow).pwaSentinel)).toBe('alive')

  // Level over: the offer appears, and only the explicit action reloads.
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(updateToast(page)).toBeVisible()
  await updateToast(page).getByRole('button', { name: 'Update' }).click()
  await expect.poll(() => page.evaluate(() => (window as PwaWindow).pwaSentinel ?? null)).toBeNull()
})

test('never stores API responses in Cache Storage', async ({ page }) => {
  await page.goto(REAL_URL)
  await startNewProfile(page)
  await waitForOfflineReady(page)
  // Reload once so the worker controls the page before the API calls.
  await page.reload()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true)

  // The worker's NetworkOnly route handles these; the point is that they are attempted.
  await page.evaluate(async () => {
    for (const url of ['/api/progress', 'https://api.example.test/sync/attempts']) {
      await fetch(url).catch(() => undefined)
    }
  })

  const cached = await page.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) {
      const cache = await caches.open(name)
      for (const request of await cache.keys()) urls.push(request.url)
    }
    return urls
  })
  expect(cached.filter((url) => /\/api\/|api\.example\.test/.test(url))).toEqual([])
})

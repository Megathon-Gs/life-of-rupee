import type { Page } from '@playwright/test'
import { expect, test } from '../privacy/network-allowlist'
import { interiors } from '../../src/content/interiors'
import { travelTo } from './p1/p1'

const band = (page: Page) => page.getByTestId('world-band')

async function arrive(page: Page, deterministic = false) {
  await page.goto(deterministic ? '/?test=1' : '/')
  await page.getByTestId('profile-new').click()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await expect(page.getByTestId('door-cue')).toBeFocused()
}

async function expectInteriorPanel(page: Page, location = 'bank') {
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const scrim = dialog.locator('xpath=preceding-sibling::div')
  await expect(dialog).toHaveCSS('opacity', '1')
  await expect(dialog).toHaveCSS('transform', 'none')
  await expect(scrim).toHaveCSS('opacity', '1')
  expect(await scrim.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
    'rgba(25, 26, 51, 0.55)',
  )
  const image = page.getByTestId('interior-backdrop').locator('img')
  expect(
    await page
      .getByTestId('interior-backdrop')
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none')
  await expect(image).toBeVisible()
  await expect(image).toHaveAttribute('src', interiors[location]!)
  await expect(image).toHaveJSProperty('naturalWidth', 384)
  await expect(page.getByTestId('bank-transition-proxy')).toHaveCount(0)
  await expect(page.getByTestId('skip-transition')).toHaveCount(0)
  await expect(band(page)).toHaveAttribute('inert', '')
}

for (const location of Object.keys(interiors)) {
  test(`${location}: street darkens before menu and interior appear without movement`, async ({
    page,
  }) => {
    await arrive(page)
    await travelTo(page, location)
    await page.getByTestId('door-cue').click()
    const dialog = page.getByRole('dialog')
    const halfway = await dialog.evaluate((element) => {
      const scrim = element.previousElementSibling!
      for (const target of [element, scrim]) {
        const animation = target.getAnimations()[0]!
        animation.pause()
        animation.currentTime = Number(animation.effect!.getTiming().duration) / 2
      }
      return {
        menu: getComputedStyle(element).opacity,
        scrim: Number(getComputedStyle(scrim).opacity),
        transform: getComputedStyle(element).transform,
      }
    })
    expect(halfway.menu).toBe('0')
    expect(halfway.scrim).toBeGreaterThan(0)
    expect(halfway.scrim).toBeLessThan(1)
    expect(halfway.transform).toBe('none')
    await dialog.evaluate((element) => {
      for (const target of [element, element.previousElementSibling!]) {
        target.getAnimations()[0]!.finish()
      }
    })
    await expectInteriorPanel(page, location)
    if (page.viewportSize()!.width >= 768) {
      const image = await page.getByTestId('interior-backdrop').boundingBox()
      const menu = await dialog.boundingBox()
      expect(image!.x + image!.width).toBeLessThanOrEqual(menu!.x)
    }
  })
}

test('bank interior opens on first entry, repeat entry and reload', async ({ page }) => {
  await arrive(page)
  await page.getByTestId('door-cue').click()
  await expectInteriorPanel(page)
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByTestId('door-cue')).toBeFocused()
  await page.keyboard.press('Enter')
  await expectInteriorPanel(page)
  await page.reload()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await page.getByTestId('door-cue').click()
  await expectInteriorPanel(page)
})

test('reduced-motion bank entry is also immediate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await arrive(page)
  await page.keyboard.press('Enter')
  await expectInteriorPanel(page)
  await expect(page.getByRole('dialog')).toHaveCSS('animation-duration', '0s')
})

test('Escape and backdrop click close the bank and unlock travel', async ({ page }) => {
  await arrive(page)
  await page.getByTestId('door-cue').click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(band(page)).not.toHaveAttribute('inert', '')
  await page.getByTestId('door-cue').click()
  await page
    .getByRole('dialog')
    .locator('xpath=preceding-sibling::div')
    .click({ position: { x: 1, y: 1 } })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(band(page)).not.toHaveAttribute('inert', '')
  await page.keyboard.press('ArrowRight')
  await expect(band(page)).toHaveAttribute('data-location', 'kirana')
})

test('bank panel with interior matches its viewport reference', async ({ page }) => {
  await arrive(page, true)
  await page.keyboard.press('Enter')
  await expectInteriorPanel(page)
  const dialogue = page.getByRole('region', { name: /Street guide/ })
  const dialogueRect = await dialogue.boundingBox()
  const panelRect = await page.getByRole('dialog').boundingBox()
  expect(dialogueRect!.x).toBeGreaterThanOrEqual(panelRect!.x)
  expect(dialogueRect!.x + dialogueRect!.width).toBeLessThanOrEqual(panelRect!.x + panelRect!.width)
  await expect(page).toHaveScreenshot('bank-entry.png', { animations: 'disabled' })
})

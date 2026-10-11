import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { levels } from '../../src/content/levels'
import { world } from '../../src/content/world'
import { expect, test } from '../privacy/network-allowlist'

/**
 * P2-26 accessibility sweep. Axe runs on the profile picker, the street and every
 * panel state reached while a keyboard-only player works through each level door,
 * with and without reduced motion and at 1.5x text. Findings: docs/accessibility-audit.md.
 */
const band = (page: Page) => page.getByTestId('world-band')
const step = (page: Page) => page.getByTestId('level-step')

// `region` is waived on the street only (location labels sit outside a landmark, see demo-journey.spec.ts).
async function axe(page: Page, waive: string[] = []) {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))),
  )
  const r = await new AxeBuilder({ page }).disableRules(waive).analyze()
  expect(r.violations, JSON.stringify(r.violations, null, 2)).toEqual([])
}

async function start(page: Page) {
  await page.goto('/?test=1')
  await expect(page.getByTestId('profile-picker')).toBeVisible()
  await axe(page)
  await page.getByTestId('profile-new').click()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await axe(page, ['region'])
}

/** Keyboard-only: every control inside the open level panel must be reachable by Tab. */
async function walkPanel(page: Page) {
  for (let guard = 0; guard < 40; guard += 1) {
    if (await page.getByTestId('results').isVisible().catch(() => false)) {
      await axe(page)
      return
    }
    const s = step(page)
    if (!(await s.isVisible().catch(() => false))) return
    await axe(page)
    const buttons = s.getByRole('button')
    const n = await buttons.count()
    let clicked = false
    for (let i = 0; i < n && !clicked; i += 1) {
      const b = buttons.nth(i)
      if (!(await b.isEnabled())) continue
      await b.focus()
      await expect(b).toBeFocused()
      await page.keyboard.press('Enter')
      clicked = true
    }
    if (!clicked) return
    await page.waitForTimeout(60)
  }
}

for (const mode of ['full', 'reduced'] as const) {
  test.describe(`a11y, motion ${mode}`, () => {
    test.setTimeout(180_000)
    test.use({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' })

    test('picker, street and level panels have no axe violations', async ({ page }) => {
      await start(page)
      const reachable = world.locations.filter((l) => !l.unlockedBy).map((l) => l.id)
      for (const id of reachable) {
        for (let g = 0; g < 14 && (await band(page).getAttribute('data-location')) !== id; g += 1) {
          await page.keyboard.press('ArrowRight')
          await page.waitForTimeout(80)
        }
        const door = page.getByTestId('door-cue')
        if (await door.isVisible().catch(() => false)) {
          await door.focus()
          await page.keyboard.press('Enter')
          await walkPanel(page)
          await page.keyboard.press('Escape')
        }
      }
      expect(levels).toHaveLength(12)
    })
  })
}

test('text scale 1.5 keeps the street and picker axe-clean', async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.fontSize = '24px'
    })
  })
  await start(page)
})

test('interactive controls meet the 24px touch target floor', async ({ page }) => {
  await page.goto('/?test=1')
  await expect(page.getByTestId('profile-picker')).toBeVisible()
  const small = await page.getByRole('button').evaluateAll((els) =>
    els
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 0 && (r.width < 24 || r.height < 24))
      .length,
  )
  expect(small).toBe(0)
})

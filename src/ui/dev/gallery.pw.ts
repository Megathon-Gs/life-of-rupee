import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const SURFACES = ['hud', 'dialogue', 'panel', 'results', 'skilltree', 'settings'] as const
const VIEWPORTS = [
  { name: 'phone-360', width: 360, height: 740 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

// Read via globalThis so Node's global types stay out of the browser-typed UI program.
const shots = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.GALLERY_SHOTS

async function open(page: Page, surface: string, locale: 'en' | 'te', extra = '') {
  await page.goto(`/src/ui/dev/gallery.html?surface=${surface}&locale=${locale}${extra}`)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('[data-ps-ui]').first().waitFor()
}

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' })

    for (const locale of ['en', 'te'] as const) {
      for (const surface of SURFACES) {
        test(`${surface} (${locale}): axe incl. contrast, tap targets, no clipping`, async ({ page }) => {
          await open(page, surface, locale)

          const results = await new AxeBuilder({ page }).analyze()
          expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(' ')}`)).toEqual([])

          // Every control a person can press must be at least 44×44 CSS px.
          const small = await page.evaluate(() => {
            const controls = document.querySelectorAll<HTMLElement>(
              'button, a[href], input, [role="switch"], [tabindex]:not([tabindex="-1"])',
            )
            return [...controls]
              .filter(el => !el.closest('[inert]'))
              .map(el => {
                // Radios and switches hide the native input; the visible face is its sibling.
                const box = (el.matches('input') ? (el.parentElement ?? el) : el).getBoundingClientRect()
                return { label: el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30), w: box.width, h: box.height }
              })
              .filter(box => box.w > 0 && (box.w < 44 || box.h < 44))
          })
          expect(small).toEqual([])

          // No horizontal page scroll and no text clipped by its own box.
          const overflow = await page.evaluate(() => ({
            page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            clipped: [...document.querySelectorAll<HTMLElement>('[data-ps-ui] *')]
              .filter(el => el.children.length === 0 && el.textContent?.trim())
              .filter(el => el.clientWidth > 2 && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible')
              .map(el => el.textContent?.trim().slice(0, 30)),
          }))
          expect(overflow).toEqual({ page: 0, clipped: [] })

          if (shots) await page.screenshot({ path: `${shots}/${surface}-${locale}-${viewport.name}.png` })
        })
      }
    }
  })
}

test.describe('behaviour in a real browser', () => {
  test.use({ viewport: { width: 360, height: 740 }, reducedMotion: 'reduce' })

  test('PanelShell: Escape closes, focus returns to the opener, scroll is contained', async ({ page }) => {
    await open(page, 'panel', 'en')
    const body = page.locator('[role="dialog"] > div').nth(1)
    expect(await body.evaluate(el => getComputedStyle(el).overscrollBehaviorY)).toBe('contain')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Inspect a fictional identity document' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Inspect a fictional identity document' })).toBeFocused()
  })

  test('PanelShell: the world behind an open panel is inert', async ({ page }) => {
    await open(page, 'panel', 'en')
    expect(await page.locator('[inert]').count()).toBeGreaterThan(0)
  })

  test('ResultsScreen: full motion reveals stars one by one, reduced motion all at once', async ({ browser }) => {
    const full = await browser.newPage({ viewport: { width: 360, height: 740 }, reducedMotion: 'no-preference' })
    await open(full, 'results', 'en', '&motion=full')
    const revealed = () => full.locator('[data-testid="result-star"][data-revealed="true"]').count()
    expect(await revealed()).toBeLessThan(3)
    await expect.poll(revealed, { timeout: 4000 }).toBe(3)
    await full.close()

    const reduced = await browser.newPage({ viewport: { width: 360, height: 740 }, reducedMotion: 'reduce' })
    await open(reduced, 'results', 'en')
    expect(await reduced.locator('[data-testid="result-star"][data-revealed="true"]').count()).toBe(3)
    await reduced.close()
  })

  test('world band scales by whole numbers with nearest-neighbour rendering', async ({ page }) => {
    await open(page, 'hud', 'en')
    const canvas = page.locator('canvas[data-world-scale]')
    const info = await canvas.evaluate(el => ({
      scale: Number(el.getAttribute('data-world-scale')),
      cssWidth: el.getBoundingClientRect().width,
      width: (el as HTMLCanvasElement).width,
      rendering: getComputedStyle(el).imageRendering,
    }))
    expect(Number.isInteger(info.scale)).toBe(true)
    expect(info.cssWidth).toBe(info.width * info.scale)
    expect(['pixelated', 'crisp-edges']).toContain(info.rendering)
  })

  test('text size 150% keeps Telugu readable without horizontal scroll', async ({ page }) => {
    await open(page, 'settings', 'te')
    await page.getByRole('radio', { name: 'ఇంకా పెద్దది' }).check({ force: true })
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(scroll).toBe(0)
  })
})

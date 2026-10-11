import type { Locator, Page } from '@playwright/test'
import { wheelBurst } from './harness/input'
import { expect, test } from '../privacy/network-allowlist'

const APP_URL = '/?test=1&fixtures=only'
const INTERACTION_STEPS = ['lesson', 'decision', 'transfer']

const band = (page: Page) => page.getByTestId('world-band')
const levelStep = (page: Page) => page.getByTestId('level-step')

async function startNewProfile(page: Page) {
  await page.goto(APP_URL)
  await page.getByTestId('profile-new').click()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(band(page)).toHaveAttribute('data-location', 'home')
}

/** Centre of the world band, so pointer and wheel input land on it. */
async function bandBox(page: Page) {
  const box = await band(page).boundingBox()
  if (!box) throw new Error('world band has no layout box')
  return box
}

/** A single upward swipe kept inside the band (its listeners only see pointerup on itself). */
async function swipeUpOnBand(page: Page) {
  const box = await bandBox(page)
  const x = box.x + box.width / 2
  const distance = Math.min(120, box.height * 0.6)
  const startY = box.y + box.height / 2 + distance / 2
  await page.mouse.move(x, startY)
  await page.mouse.down()
  await page.mouse.move(x, startY - distance, { steps: 8 })
  await page.mouse.up()
}

/**
 * One trackpad-style burst: `events` notches of `deltaPx`, dispatched in a single task.
 * Together they cross the 60 px threshold several times over, yet the travel machine must
 * treat them as one gesture. They go out back-to-back inside the page because, under CI
 * load, any gap between notches (even a timer inside the page) can stretch past the 200 ms
 * quiet window, which the machine rightly reads as a second gesture.
 */
async function wheelBurstOnBand(page: Page, events: number, deltaPx: number) {
  const box = await bandBox(page)
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await band(page).evaluate(
    (el, { events, deltaPx, x, y }) => {
      for (let i = 0; i < events; i += 1) {
        el.dispatchEvent(
          new WheelEvent('wheel', {
            deltaY: deltaPx,
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
          }),
        )
      }
    },
    { events, deltaPx, x, y },
  )
}

/** Steps forward with the keyboard until the protagonist stands at `id`. */
async function travelTo(page: Page, id: string) {
  const order = ['home', 'bank', 'kirana', 'filler-1', 'filler-2']
  for (let guard = 0; guard < order.length; guard += 1) {
    const at = await band(page).getAttribute('data-location')
    if (at === id) return
    await expect(band(page)).toHaveAttribute('data-travelling', 'false')
    const dir = order.indexOf(id) > order.indexOf(at ?? '') ? 'ArrowRight' : 'ArrowLeft'
    await page.keyboard.press(dir)
    await expect(band(page)).not.toHaveAttribute('data-location', at ?? '')
  }
  await expect(band(page)).toHaveAttribute('data-location', id)
}

async function stepType(page: Page): Promise<string | null> {
  if (!(await levelStep(page).isVisible())) return null
  return levelStep(page).getAttribute('data-step-type')
}

/** Resolves once the active step is no longer the one we were answering. */
async function waitForStepChange(page: Page, from: string, step: Locator) {
  await expect
    .poll(async () => (await step.isVisible()) && (await stepType(page)) === from, {
      timeout: 2000,
    })
    .toBe(false)
}

/** Answers a FormFiller or DocumentInspector by trying each option until it is accepted. */
async function completeInteraction(page: Page, type: string) {
  const step = levelStep(page)
  const fieldsets = step.locator('fieldset')
  const advanced = async () => (await stepType(page)) !== type || !(await step.isVisible())

  if ((await fieldsets.count()) > 0) {
    // FormFiller: only a correct option is marked pressed; the last correct field completes it.
    const total = await fieldsets.count()
    for (let i = 0; i < total; i += 1) {
      if (await advanced()) return
      const field = fieldsets.nth(i)
      const options = field.locator('button[aria-pressed]')
      const count = await options.count()
      for (let j = 0; j < count; j += 1) {
        if ((await field.locator('button[aria-pressed="true"]').count()) > 0) break
        await options.nth(j).click()
        if (await advanced()) return
      }
    }
  } else {
    // DocumentInspector: the first answer field completes it.
    const options = step.locator('button[aria-pressed]')
    const count = await options.count()
    for (let j = 0; j < count; j += 1) {
      await options.nth(j).click()
      if (await advanced()) return
    }
  }
  await waitForStepChange(page, type, step)
}

/** Walks every step of the open level until the results screen shows. */
async function playLevel(page: Page) {
  const results = page.getByTestId('results')
  for (let guard = 0; guard < 40; guard += 1) {
    if (await results.isVisible()) return
    const type = await stepType(page)
    if (type === 'hook' || type === 'consequence') {
      await levelStep(page)
        .getByRole('button', { name: /^(Continue|Done)$/ })
        .click()
    } else if (type && INTERACTION_STEPS.includes(type)) {
      await completeInteraction(page, type)
    } else {
      // Travel steps resolve on their own at the level's location; give the UI a beat.
      await page.waitForTimeout(100)
    }
  }
  await expect(results).toBeVisible()
}

async function openBankLevel(page: Page) {
  await travelTo(page, 'bank')
  const door = page.getByTestId('door-cue')
  await expect(door).toBeVisible()
  await expect(door).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(levelStep(page)).toBeVisible()
}

async function completeBankLevel(page: Page) {
  await openBankLevel(page)
  await playLevel(page)
  await page.getByTestId('results').getByRole('button', { name: 'Back to the street' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(band(page)).not.toHaveAttribute('inert', /.*/)
}

const parseJson = (value: string | null) => JSON.parse(value ?? '{}') as Record<string, unknown>

test('one swipe moves one location and one wheel burst moves one more', async ({ page }) => {
  await startNewProfile(page)

  await swipeUpOnBand(page)
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await page.waitForTimeout(500)
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await expect(band(page)).toHaveAttribute('data-travelling', 'false')

  await wheelBurstOnBand(page, 8, 40)
  await expect(band(page)).toHaveAttribute('data-location', 'kirana')
  await page.waitForTimeout(500)
  await expect(band(page)).toHaveAttribute('data-location', 'kirana')
})

test('completing the bank fixture level shows results and applies the teller variant', async ({
  page,
}) => {
  await startNewProfile(page)
  await completeBankLevel(page)

  await expect
    .poll(async () => parseJson(await band(page).getAttribute('data-visuals')).bank)
    .toBe('greets')
  const stars = parseJson(await band(page).getAttribute('data-stars'))
  expect(Object.values(stars).some((value) => Number(value) >= 1)).toBe(true)
})

test('profile creation, saving, and lesson completion work without crypto.randomUUID', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
  })
  await startNewProfile(page)
  await completeBankLevel(page)
  const stars = await band(page).getAttribute('data-stars')
  expect(Object.keys(parseJson(stars)).length).toBeGreaterThan(0)
  await page.reload()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await expect(band(page)).toHaveAttribute('data-stars', stars ?? '')
})

test('reload restores the same location and stars', async ({ page }) => {
  await startNewProfile(page)
  await completeBankLevel(page)
  await travelTo(page, 'kirana')

  const stars = await band(page).getAttribute('data-stars')
  expect(Object.keys(parseJson(stars)).length).toBeGreaterThan(0)

  await page.reload()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(page.getByTestId('profile-picker')).toHaveCount(0)
  await expect(band(page)).toHaveAttribute('data-location', 'kirana')
  await expect(band(page)).toHaveAttribute('data-stars', stars ?? '')
})

test('scrolling inside the level panel does not move the world', async ({ page }) => {
  await startNewProfile(page)
  await openBankLevel(page)
  await expect(band(page)).toHaveAttribute('inert', /.*/)

  const dialog = page.getByRole('dialog')
  const box = await dialog.boundingBox()
  if (!box) throw new Error('level panel has no layout box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  for (let burst = 0; burst < 3; burst += 1) {
    await wheelBurst(page, 6, 120, 200)
    await wheelBurst(page, 6, -120, 200)
  }
  await page.waitForTimeout(400)

  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await expect(band(page)).toHaveAttribute('inert', /.*/)
})

test('wide side panel keeps the door cue in the visible street area', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop')
  await startNewProfile(page)
  await travelTo(page, 'bank')
  await page.getByTestId('door-cue').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const cue = await page.getByTestId('door-cue').boundingBox()
  const panel = await dialog.boundingBox()
  if (!cue || !panel) throw new Error('door cue or panel has no layout box')
  expect(cue.x + cue.width / 2).toBeLessThan(panel.x)
})

test('first-level load transfers at most 1.5 MB', async ({ page }) => {
  let bytes = 0
  page.on('response', async (response) => {
    const sizes = await response
      .request()
      .sizes()
      .catch(() => null)
    if (sizes) bytes += sizes.responseBodySize + sizes.responseHeadersSize
  })
  await startNewProfile(page)
  await page.waitForLoadState('networkidle')
  expect(bytes).toBeGreaterThan(0)
  expect(bytes).toBeLessThanOrEqual(1.5 * 1024 * 1024)
})

test('labels each location from i18n and hides them while a panel is open', async ({ page }) => {
  await startNewProfile(page)
  await expect(page.getByTestId('label-home')).toBeVisible()
  await expect(page.getByTestId('label-bank')).toHaveCount(1)
  await travelTo(page, 'bank')
  await page.getByTestId('door-cue').click()
  await expect(page.getByTestId('label-bank')).toBeHidden()
})

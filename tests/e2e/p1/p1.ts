import { expect, type Page } from '@playwright/test'
import { levels } from '../../../src/content/levels'
import { TEST_SEED } from '../../../src/app/mode'
import { pickIndex } from '../../../src/level-runner/prng'

/** Shared driving helpers for the P1 level specs (L4, L5, L9). */
export const APP_URL = '/?test=1'

export const band = (page: Page) => page.getByTestId('world-band')
export const step = (page: Page) => page.getByTestId('level-step')
export const results = (page: Page) => page.getByTestId('results')
export const option = (page: Page, name: string | RegExp) =>
  step(page).getByRole('button', { name, exact: typeof name === 'string' })

/** The transfer variant the fixed test seed selects for a level. */
export function transferVariant(levelId: string) {
  const level = levels.find((candidate) => candidate.id === levelId)!
  const variants = level.steps[5].variants
  return variants[pickIndex(TEST_SEED, variants.length)]!
}

export async function startFreshProfile(page: Page) {
  await page.goto(APP_URL)
  await page.getByTestId('profile-new').click()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(band(page)).toHaveAttribute('data-location', 'home')
}

/** Steps east until the protagonist stands at `id`; never skips a building. */
export async function travelTo(page: Page, id: string) {
  for (let guard = 0; guard < 12; guard += 1) {
    const at = await band(page).getAttribute('data-location')
    if (at === id) return
    await expect(band(page)).toHaveAttribute('data-travelling', 'false')
    await page.keyboard.press('ArrowRight')
    await expect(band(page)).not.toHaveAttribute('data-location', at ?? '')
  }
  await expect(band(page)).toHaveAttribute('data-location', id)
}

export async function openDoor(page: Page) {
  const door = page.getByTestId('door-cue')
  await expect(door).toBeVisible()
  await door.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(step(page)).toBeVisible()
}

/** Advances a Hook or Consequence dialogue until the runner moves on. */
export async function finishDialogue(page: Page, type: 'hook' | 'consequence') {
  await expect(step(page)).toHaveAttribute('data-step-type', type)
  for (let guard = 0; guard < 6; guard += 1) {
    if ((await step(page).getAttribute('data-step-type')) !== type) return
    await step(page).getByRole('button', { name: /^(Continue|Done)$/ }).click()
    await page.waitForTimeout(30)
  }
  await expect(step(page)).not.toHaveAttribute('data-step-type', type)
}

export async function expectStars(page: Page, stars: number, reviews: number) {
  await expect(results(page)).toBeVisible()
  await expect(
    results(page).locator('[data-testid="result-star"][data-state="earned"]'),
  ).toHaveCount(stars)
  await expect(results(page).locator('li[data-severity]')).toHaveCount(reviews)
}

export async function approveUpiWithMockPin(page: Page) {
  await option(page, 'Approve payment (simulate PIN)').click()
  for (const digit of [1, 2, 3, 4]) {
    await step(page).getByRole('button', { name: `Enter mock digit ${digit}` }).click()
  }
  await option(page, 'Confirm mock PIN').click()
}

/** Ticks the named warning signs, then classifies the current message. */
export async function triage(page: Page, answer: 'safe' | 'fraud', signs: string[]) {
  for (const sign of signs) await step(page).getByRole('checkbox', { name: sign }).check()
  await option(page, answer === 'fraud' ? 'Mark fraud' : 'Mark safe').click()
}

export async function closeResults(page: Page) {
  await results(page).getByRole('button', { name: 'Back to the street' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
}
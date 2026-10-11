import { expect, test } from '../../privacy/network-allowlist'
import type { Page } from '@playwright/test'
import {
  approveUpiWithMockPin,
  band,
  closeResults,
  expectStars,
  finishDialogue,
  openDoor,
  option,
  results,
  startFreshProfile,
  step,
  transferVariant,
  travelTo,
  triage,
} from './p1'

/**
 * P1 levels end to end on every Playwright project (phone-small, phone-large,
 * desktop): a clean run earns 3 stars, the scripted mistake earns 2 stars with
 * its review card, and progress survives a reload. Numbers, people and handles
 * are fictional (content lint owns the claims).
 */

const URGENCY = 'Urgency: pushes you to act right now'
const UNKNOWN_LINK = 'Unknown link: asks you to open or tap a link'
const OTP_PIN = 'OTP or PIN request: asks for a secret code'
const PRIZE = 'Too-good-to-be-true prize or reward'
const PAYMENT = 'Payment request: asks you to send money'

/** L4: the lesson decline, the verified-payment decision, then a mismatched transfer. */
async function playL4(page: Page, withMistake: boolean) {
  await finishDialogue(page, 'hook')
  await option(page, 'Decline this request').click()
  await expect(step(page)).toHaveAttribute('data-step-type', 'decision')
  if (withMistake) {
    await option(page, 'Decline and re-check with the shopkeeper').click()
    await expect(step(page).getByRole('status')).toBeVisible()
  }
  await approveUpiWithMockPin(page)
  await finishDialogue(page, 'consequence')
  await option(page, 'Decline and re-check with the shopkeeper').click()
  await expectStars(page, withMistake ? 2 : 3, withMistake ? 1 : 0)
}

/** L5: lesson and decision triage, then the seeded transfer messages. */
async function playL5(page: Page, withMistake: boolean) {
  await finishDialogue(page, 'hook')
  await triage(page, 'fraud', [URGENCY, UNKNOWN_LINK])
  await triage(page, 'safe', [])
  await expect(step(page)).toHaveAttribute('data-step-type', 'decision')
  await triage(page, 'fraud', [URGENCY, OTP_PIN])
  await triage(page, 'fraud', [PRIZE, PAYMENT])
  await triage(page, 'fraud', [URGENCY, UNKNOWN_LINK])
  if (withMistake) await option(page, 'Mark fraud').click()
  await triage(page, 'safe', [])
  await finishDialogue(page, 'consequence')
  const variant = transferVariant('l05-fraud-safety')
  if (variant.id === 'lucky-winner-request') {
    await triage(page, 'safe', [])
    await triage(page, 'fraud', [PRIZE, PAYMENT])
  } else {
    await triage(page, 'fraud', [URGENCY, UNKNOWN_LINK])
    await triage(page, 'safe', [])
  }
  await expectStars(page, withMistake ? 2 : 3, withMistake ? 1 : 0)
}

/** L9: two-length lesson, budget-aware decision, then the seeded transfer. */
async function playL9(page: Page, withMistake: boolean) {
  // A fresh profile has no Level 5 flag, so the return-visit hook is skipped.
  await expect(step(page)).toHaveAttribute('data-step-type', 'lesson')
  await option(page, 'Choose: Offer 1: 12 months').click()
  await expect(step(page)).toHaveAttribute('data-step-type', 'decision')
  if (withMistake) {
    await option(page, 'Choose: Offer 1: 60 months').click()
    await expect(step(page).getByRole('status')).toBeVisible()
  }
  await option(page, 'Choose: Offer 2: 18 months').click()
  await finishDialogue(page, 'consequence')
  const variant = transferVariant('l09-loans-emi')
  if (variant.id === 'kiran-tools-loan') {
    await option(page, 'Choose: Offer 3: 24 months with a fee').click()
  } else {
    await option(page, 'Postpone borrowing and save first').click()
    await option(page, /would repay about .* in total against/).click()
    await option(page, /still due and a missed one adds the stated/).click()
  }
  await expectStars(page, withMistake ? 2 : 3, withMistake ? 1 : 0)
}

test.describe('P1 Level 4 — UPI', () => {
  test.setTimeout(120_000)

  test('clean run earns 3 stars', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'phone-shop')
    await openDoor(page)
    await playL4(page, false)
  })

  test('scripted mistake earns 2 stars with its review card', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'phone-shop')
    await openDoor(page)
    await playL4(page, true)
  })

  test('reload keeps stars, the lit shop and the next level', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'phone-shop')
    await openDoor(page)
    await playL4(page, false)
    await closeResults(page)
    await expect
      .poll(async () => JSON.parse((await band(page).getAttribute('data-visuals')) ?? '{}')['phone-shop'])
      .toBe('lit')

    await page.reload()
    await expect(band(page)).toHaveAttribute('data-ready', 'true')
    await expect(band(page)).toHaveAttribute('data-location', 'phone-shop')
    const stars = JSON.parse((await band(page).getAttribute('data-stars')) ?? '{}')
    expect(stars['l04-upi-basics']).toBe(3)
    await expect
      .poll(async () => JSON.parse((await band(page).getAttribute('data-visuals')) ?? '{}')['phone-shop'])
      .toBe('lit')

    // The completed Level 4 gives way to Level 5 at the same counter.
    await openDoor(page)
    await expect(step(page)).toHaveAttribute('data-step-type', 'hook')
  })
})

test.describe('P1 Level 5 — fraud safety', () => {
  test.setTimeout(150_000)

  test('clean run earns 3 stars', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'phone-shop')
    await openDoor(page)
    await playL4(page, false)
    await closeResults(page)
    await openDoor(page)
    await playL5(page, false)
  })

  test('scripted mistake earns 2 stars with its review card', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'phone-shop')
    await openDoor(page)
    await playL4(page, false)
    await closeResults(page)
    await openDoor(page)
    await playL5(page, true)
  })
})

test.describe('P1 Level 9 — loans', () => {
  test.setTimeout(120_000)

  test('clean run earns 3 stars', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'showroom')
    await openDoor(page)
    await playL9(page, false)
  })

  test('scripted mistake earns 2 stars with its review card', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'showroom')
    await openDoor(page)
    await playL9(page, true)
  })

  test('offer cards carry their comparison figures', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'showroom')
    await openDoor(page)
    await expect(step(page)).toHaveAttribute('data-step-type', 'lesson')
    await expect(step(page).getByTestId('offer-twelve-months')).toBeVisible()
    await expect(step(page).getByTestId('offer-thirty-six-months')).toBeVisible()
    // The hidden cost of the longer loan is shown before the learner chooses.
    await expect(step(page).getByTestId('offer-thirty-six-months')).toContainText('Total repaid')
  })
})

test('closing results returns to the street with the level done', async ({ page }) => {
  await startFreshProfile(page)
  await travelTo(page, 'phone-shop')
  await openDoor(page)
  await playL4(page, false)
  await closeResults(page)
  await expect(band(page)).toHaveAttribute('data-location', 'phone-shop')
  await expect(band(page)).not.toHaveAttribute('inert', /.*/)
  expect(await results(page).count()).toBe(0)
})
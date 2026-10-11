import { expect, test } from '../../privacy/network-allowlist'
import type { Page } from '@playwright/test'
import {
  closeResults,
  finishDialogue,
  openDoor,
  option,
  startFreshProfile,
  step,
  transferVariant,
  travelTo,
  triage,
} from './p1'

/**
 * The Level 9 return-visit callback: the easy-loan ad only repeats Level 5's
 * warning signs after that earlier choice was made. A fresh profile gets no
 * claim of remembering it (P1-09 conditional step).
 */

const URGENCY = 'Urgency: pushes you to act right now'
const UNKNOWN_LINK = 'Unknown link: asks you to open or tap a link'
const OTP_PIN = 'OTP or PIN request: asks for a secret code'
const PRIZE = 'Too-good-to-be-true prize or reward'
const PAYMENT = 'Payment request: asks you to send money'

async function completeL4(page: Page) {
  await finishDialogue(page, 'hook')
  await option(page, 'Decline this request').click()
  await expect(step(page)).toHaveAttribute('data-step-type', 'decision')
  await option(page, 'Approve payment (simulate PIN)').click()
  for (const digit of [1, 2, 3, 4]) {
    await step(page).getByRole('button', { name: `Enter mock digit ${digit}` }).click()
  }
  await option(page, 'Confirm mock PIN').click()
  await finishDialogue(page, 'consequence')
  await option(page, 'Decline and re-check with the shopkeeper').click()
  await closeResults(page)
}

async function completeL5(page: Page) {
  await finishDialogue(page, 'hook')
  await triage(page, 'fraud', [URGENCY, UNKNOWN_LINK])
  await triage(page, 'safe', [])
  await expect(step(page)).toHaveAttribute('data-step-type', 'decision')
  await triage(page, 'fraud', [URGENCY, OTP_PIN])
  await triage(page, 'fraud', [PRIZE, PAYMENT])
  await triage(page, 'fraud', [URGENCY, UNKNOWN_LINK])
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
  await closeResults(page)
}

test.describe('Level 9 remembers Level 5', () => {
  test.setTimeout(180_000)

  test('a fresh profile sees no callback', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'showroom')
    await openDoor(page)
    await expect(step(page)).toHaveAttribute('data-step-type', 'lesson')
    await expect(step(page)).not.toContainText('EASY LOAN')
  })

  test('after Level 5 the callback appears', async ({ page }) => {
    await startFreshProfile(page)
    await travelTo(page, 'phone-shop')
    await openDoor(page)
    await completeL4(page)
    await openDoor(page)
    await completeL5(page)
    await travelTo(page, 'showroom')
    await openDoor(page)
    await expect(step(page)).toHaveAttribute('data-step-type', 'hook')
    await expect(step(page)).toContainText('EASY LOAN')
  })
})
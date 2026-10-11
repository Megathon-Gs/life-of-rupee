import type { Page } from '@playwright/test'
import { world } from '../../../src/content/world'
import { SaveFileSchema } from '../../../src/core/contracts'
import { expect, test } from '../../privacy/network-allowlist'
import {
  approveUpiWithMockPin,
  band,
  closeResults,
  expectStars,
  finishDialogue,
  openDoor,
  option,
  startFreshProfile,
  step,
  travelTo,
  transferVariant,
  triage,
} from '../p1/p1'
import { IDENTIFIERS, deviceStorage, watch, type G2Window } from './g2'

/**
 * Gate G2 privacy journey (SPEC §10, product plan §11). One fresh profile plays the two
 * levels that come closest to real financial data (Level 4 UPI with a mock PIN, Level 5
 * fraud triage with an OTP request), then opens every door the street offers. Throughout:
 *  - the game never offers a place to type (no text, number, password, email, tel or file
 *    input, no textarea, no contenteditable),
 *  - no request leaves the app's origin (the shared allowlist fixture) and no request on
 *    it writes anything (no non-GET, no beacon, socket or event stream),
 *  - everything the device stores is the strict save schema, with no personal identifier
 *    and none of the mock secrets the student tapped in.
 */

async function playL4(page: Page) {
  await travelTo(page, 'phone-shop')
  await openDoor(page)
  await finishDialogue(page, 'hook')
  await option(page, 'Decline this request').click()
  await expect(step(page)).toHaveAttribute('data-step-type', 'decision')
  await approveUpiWithMockPin(page)
  await finishDialogue(page, 'consequence')
  await option(page, 'Decline and re-check with the shopkeeper').click()
  await expectStars(page, 3, 0)
  await closeResults(page)
}

async function playL5(page: Page) {
  const URGENCY = 'Urgency: pushes you to act right now'
  const LINK = 'Unknown link: asks you to open or tap a link'
  const PRIZE = 'Too-good-to-be-true prize or reward'
  const PAYMENT = 'Payment request: asks you to send money'
  await travelTo(page, 'phone-shop')
  await openDoor(page)
  await finishDialogue(page, 'hook')
  await triage(page, 'fraud', [URGENCY, LINK])
  await triage(page, 'safe', [])
  await expect(step(page)).toHaveAttribute('data-step-type', 'decision')
  await triage(page, 'fraud', [URGENCY, 'OTP or PIN request: asks for a secret code'])
  await triage(page, 'fraud', [PRIZE, PAYMENT])
  await triage(page, 'fraud', [URGENCY, LINK])
  await triage(page, 'safe', [])
  await finishDialogue(page, 'consequence')
  if (transferVariant('l05-fraud-safety').id === 'lucky-winner-request') {
    await triage(page, 'safe', [])
    await triage(page, 'fraud', [PRIZE, PAYMENT])
  } else {
    await triage(page, 'fraud', [URGENCY, LINK])
    await triage(page, 'safe', [])
  }
  await expectStars(page, 3, 0)
  await closeResults(page)
}

/** Opens each door the street currently offers and leaves again, as a curious student would. */
async function openEveryDoor(page: Page) {
  for (const location of world.locations) {
    if (location.id === 'home') continue
    await travelTo(page, location.id).catch(() => undefined)
    if ((await band(page).getAttribute('data-location')) !== location.id) continue
    const door = page.getByTestId('door-cue')
    if (!(await door.isVisible().catch(() => false))) continue
    await door.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
}

test.describe('G2 privacy gate', () => {
  test.setTimeout(240_000)

  test('the journey needs no real data and nothing leaves the device', async ({ page }) => {
    const sameOriginWrites: string[] = []
    page.on('request', (request) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        sameOriginWrites.push(`${request.method()} ${request.url()}`)
      }
    })
    await watch(page)
    await startFreshProfile(page)

    await playL4(page)
    await playL5(page)
    await openEveryDoor(page)

    expect(sameOriginWrites, 'the app never sends a write request').toEqual([])
    const seen = await page.evaluate(() => (window as G2Window).__g2)
    expect(seen?.typing, 'no screen offers a place to type').toEqual([])
    expect(seen?.channels, 'no beacon, socket, event stream or XHR write').toEqual([])
    await expect(band(page)).toHaveAttribute('data-ready', 'true')
  })
})

test('stored data is the strict save schema, with no identifier or mock secret', async ({
  page,
}) => {
  await watch(page)
  await startFreshProfile(page)
  await playL4(page)

  const dump = await deviceStorage(page)
  const rows = (dump['idb:paisa-street/saves'] ?? []) as { file: unknown }[]
  expect(rows).toHaveLength(1)
  // Strict schemas reject any extra field, so a name or number cannot ride along unseen.
  expect(() => SaveFileSchema.parse(rows[0]!.file)).not.toThrow()

  const text = JSON.stringify(dump)
  for (const [kind, pattern] of Object.entries(IDENTIFIERS)) {
    expect(text.match(pattern), `stored data matches the ${kind} shape`).toBeNull()
  }
  // The mock PIN digits tapped in Level 4 are never stored as a value.
  const values = [...text.matchAll(/"([^"]*)"/g)].map((m) => m[1])
  expect(values).not.toContain('1234')
  expect(rows.map((r) => Object.keys(r.file as object).sort())).toEqual([
    ['attempts', 'learner', 'position', 'schemaVersion', 'seen', 'settings'],
  ])
  expect(Object.keys((rows[0]!.file as { learner: object }).learner).sort()).toEqual(
    expect.arrayContaining(['localId']),
  )
})

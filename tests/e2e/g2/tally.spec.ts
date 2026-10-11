import { readFileSync } from 'node:fs'
import { expect, test } from '../../privacy/network-allowlist'
import {
  band,
  closeResults,
  expectStars,
  finishDialogue,
  openDoor,
  option,
  startFreshProfile,
  step,
  travelTo,
} from '../p1/p1'
import { watch, type G2Window } from './g2'

/** The pilot tally snippet prints counts only, and the typing probe really does see inputs. */
const TALLY = readFileSync('docs/pilot/tally.js', 'utf8')

test('tally snippet reports aggregate counts and no identifier', async ({ page }) => {
  test.setTimeout(120_000)
  await startFreshProfile(page)
  await travelTo(page, 'bank')
  await openDoor(page)
  // Level 2: one clean run, so exactly one finished attempt.
  await finishDialogue(page, 'hook')
  await option(page, 'Choose Document type').click()
  await option(page, 'Minor account; follow bank and guardian requirements').click()
  await option(page, 'Passport — fictional sample').click()
  await finishDialogue(page, 'consequence')
  // The fixed test seed picks one of two fictional people for the transfer.
  const isTara =
    (await step(page)
      .getByText(/Tara is 16/)
      .count()) > 0
  const minor = 'Minor account; follow bank and guardian requirements'
  const adult = 'Adult account, no guardian details'
  await option(page, isTara ? minor : adult).click()
  await option(
    page,
    isTara
      ? "Tara's passport — SAMPLE ONLY (TARA-DEMO)"
      : "Arun's voter ID — SAMPLE ONLY (ARUN-DEMO)",
  ).click()
  await expectStars(page, 3, 0)
  await closeResults(page)

  const localId = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open('paisa-street')
        open.onsuccess = () => {
          const all = open.result.transaction('profiles').objectStore('profiles').getAll()
          all.onsuccess = () => resolve((all.result[0] as { localId: string }).localId)
        }
      }),
  )
  const out = (await page.evaluate(TALLY)) as {
    devices_profiles: number
    levels: Record<string, Record<string, number>>
    errors: Record<string, unknown>
  }
  expect(out.devices_profiles).toBe(1)
  expect(out.levels['l02-bank-account']).toEqual({ learners_finished: 1, first_attempt_3_stars: 1 })
  expect(out.errors).toEqual({})
  expect(JSON.stringify(out)).not.toContain(localId)
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
})

test('the typing probe reports a text field the moment one appears', async ({ page }) => {
  await watch(page)
  await page.goto('/?test=1')
  await page.evaluate(() => {
    document.body.append(Object.assign(document.createElement('input'), { type: 'text' }))
  })
  await expect
    .poll(() => page.evaluate(() => (window as G2Window).__g2?.typing.length))
    .toBeGreaterThan(0)
})

import type { Locator, Page } from '@playwright/test'
import { skillTree } from '../../src/content/skillTree'
import { level as level02 } from '../../src/content/levels/l02/level'
import AxeBuilder from '@axe-core/playwright'
import { expectNoAxeViolations } from './harness/accessibility'
import { expect, test } from '../privacy/network-allowlist'

/**
 * P0-23 demo journey (technical plan, "Demo journey test"), played against the real
 * Level 2 content on every Playwright project. The scripted mistake is the one documented
 * in `src/content/levels/l02/level.ts` (P0-18): pick the adult account route, correct it
 * to the minor route, then answer the transfer correctly. That scores 2 stars; a clean
 * run scores 3.
 */

const APP_URL = '/?test=1'
const LEVEL_ID = 'l02-bank-account'

// English strings of Level 2 (src/content/locales/en/l02.json).
const TEXT = {
  lessonRight: 'Choose Document type',
  adult: 'Adult account, no guardian details',
  minor: 'Minor account; follow bank and guardian requirements',
  passport: 'Passport — fictional sample',
  taraMinor: 'Minor account; follow bank and guardian requirements',
  taraPassport: "Tara's passport — SAMPLE ONLY (TARA-DEMO)",
  arunAdult: 'Adult account, no guardian details',
  arunVoter: "Arun's voter ID — SAMPLE ONLY (ARUN-DEMO)",
  reviewMistake: /account route that does not match the person's age/,
}

type InputMode = 'pointer' | 'keyboard'

const band = (page: Page) => page.getByTestId('world-band')
const levelStep = (page: Page) => page.getByTestId('level-step')
const results = (page: Page) => page.getByTestId('results')

/** Presses Tab until `target` has focus (keyboard-only reach), failing if it never does. */
async function tabTo(page: Page, target: Locator) {
  for (let presses = 0; presses < 80; presses += 1) {
    const focused = await target.evaluate((el) => el === document.activeElement).catch(() => false)
    if (focused) return
    await page.keyboard.press('Tab')
  }
  throw new Error('keyboard focus never reached the control')
}

/** Activates a control the way the variant under test would: a tap, or Tab then Enter. */
async function activate(page: Page, target: Locator, mode: InputMode) {
  if (mode === 'pointer') {
    await target.click()
    return
  }
  await tabTo(page, target)
  await page.keyboard.press('Enter')
}

/** A single upward swipe kept inside the band (its listeners only see pointerup on itself). */
async function swipeUpOnBand(page: Page) {
  const box = await band(page).boundingBox()
  if (!box) throw new Error('world band has no layout box')
  const x = box.x + box.width / 2
  const distance = Math.min(120, box.height * 0.6)
  const startY = box.y + box.height / 2 + distance / 2
  await page.mouse.move(x, startY)
  await page.mouse.down()
  await page.mouse.move(x, startY - distance, { steps: 8 })
  await page.mouse.up()
}

interface SavedAttempt {
  levelId: string
  stars: number
}

/** The current profile's attempt log, read straight from the app's own IndexedDB. */
async function savedAttempts(page: Page): Promise<SavedAttempt[]> {
  return page.evaluate(
    () =>
      new Promise<SavedAttempt[]>((resolve, reject) => {
        const open = indexedDB.open('paisa-street')
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const db = open.result
          const all = db.transaction('saves').objectStore('saves').getAll()
          all.onerror = () => reject(all.error)
          all.onsuccess = () => {
            db.close()
            const rows = all.result as { file: { attempts: SavedAttempt[] } }[]
            resolve(rows.flatMap((row) => row.file.attempts))
          }
        }
      }),
  )
}

/**
 * Axe on the street. The shared harness is strict, but the DOM location labels
 * (`LocationLabels`, P0-22) sit in a bare <ul> outside any landmark, which trips the
 * best-practice `region` rule. Only that rule is switched off here; every other rule
 * still applies. The strict check lives in the fixme'd test at the end of this file.
 */
async function expectStreetAxe(page: Page) {
  const results = await new AxeBuilder({ page }).disableRules(['region']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

const parseJson = (value: string | null) => JSON.parse(value ?? '{}') as Record<string, unknown>

async function startFreshProfile(page: Page, mode: InputMode) {
  await page.goto(APP_URL)
  await expect(page.getByTestId('profile-picker')).toBeVisible()
  await expectNoAxeViolations(page)
  await activate(page, page.getByTestId('profile-new'), mode)
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(band(page)).toHaveAttribute('data-location', 'home')
  await expectStreetAxe(page)
}

/** Moves to the next building: a swipe for pointer players, the arrow key otherwise. */
async function stepToBank(page: Page, mode: InputMode) {
  if (mode === 'pointer') await swipeUpOnBand(page)
  else await page.keyboard.press('ArrowRight')
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  // A second gesture would show up as a further move within this window.
  await page.waitForTimeout(500)
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await expect(band(page)).toHaveAttribute('data-travelling', 'false')
}

async function enterBank(page: Page, mode: InputMode) {
  const door = page.getByTestId('door-cue')
  await expect(door).toBeVisible()
  if (mode === 'keyboard') {
    // After arriving, the door is the focused control: Enter goes straight in.
    await expect(door).toBeFocused()
    await page.keyboard.press('Enter')
  } else {
    await door.click()
  }
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(levelStep(page)).toBeVisible()
}

/** Taps Continue/Done until the dialogue (hook or consequence) moves on to another step. */
async function finishDialogue(page: Page, type: 'hook' | 'consequence', mode: InputMode) {
  await expect(levelStep(page)).toHaveAttribute('data-step-type', type)
  await expectNoAxeViolations(page)
  for (let guard = 0; guard < 6; guard += 1) {
    if ((await levelStep(page).getAttribute('data-step-type')) !== type) return
    await activate(page, levelStep(page).getByRole('button', { name: /^(Continue|Done)$/ }), mode)
    await page.waitForTimeout(50)
  }
  await expect(levelStep(page)).not.toHaveAttribute('data-step-type', type)
}

const option = (page: Page, name: string) =>
  levelStep(page).getByRole('button', { name, exact: true })

async function playLesson(page: Page, mode: InputMode) {
  await expect(levelStep(page)).toHaveAttribute('data-step-type', 'lesson')
  await expectNoAxeViolations(page)
  await activate(page, option(page, TEXT.lessonRight), mode)
  await expect(levelStep(page)).not.toHaveAttribute('data-step-type', 'lesson')
}

async function playDecision(page: Page, mode: InputMode, withMistake: boolean) {
  await expect(levelStep(page)).toHaveAttribute('data-step-type', 'decision')
  await expectNoAxeViolations(page)
  if (withMistake) {
    // The scripted realistic mistake: the adult route for a minor.
    await activate(page, option(page, TEXT.adult), mode)
    await expect(levelStep(page).getByRole('status')).toBeVisible()
    await expectNoAxeViolations(page)
  }
  await activate(page, option(page, TEXT.minor), mode)
  await activate(page, option(page, TEXT.passport), mode)
  await expect(levelStep(page)).not.toHaveAttribute('data-step-type', 'decision')
}

/** Answers the transfer correctly, whichever fictional person the seed picked. */
async function playTransfer(page: Page, mode: InputMode) {
  await expect(levelStep(page)).toHaveAttribute('data-step-type', 'transfer')
  await expectNoAxeViolations(page)
  const isTara =
    (await levelStep(page)
      .getByText(/Tara is 16/)
      .count()) > 0
  if (isTara) {
    await activate(page, option(page, TEXT.taraMinor), mode)
    await activate(page, option(page, TEXT.taraPassport), mode)
  } else {
    await activate(page, option(page, TEXT.arunAdult), mode)
    await activate(page, option(page, TEXT.arunVoter), mode)
  }
  await expect(results(page)).toBeVisible()
}

async function playAttempt(page: Page, mode: InputMode, withMistake: boolean) {
  await finishDialogue(page, 'hook', mode)
  await playLesson(page, mode)
  await playDecision(page, mode, withMistake)
  await finishDialogue(page, 'consequence', mode)
  await playTransfer(page, mode)
}

const earnedStars = (page: Page) =>
  results(page).locator('[data-testid="result-star"][data-state="earned"]')

async function expectResults(page: Page, stars: number) {
  await expect(results(page)).toBeVisible()
  await expect(earnedStars(page)).toHaveCount(stars)
  await expect(
    results(page).locator('[data-testid="result-star"][data-revealed="true"]'),
  ).toHaveCount(3)
  await expectNoAxeViolations(page)
}

/** The whole demo journey, steps 1 to 7 of the technical plan. */
async function runJourney(page: Page, mode: InputMode, options: { reducedMotion?: boolean } = {}) {
  // 1. Fresh profile; one swipe moves exactly one building.
  await startFreshProfile(page, mode)
  await expect(band(page)).toHaveAttribute('data-stars', '{}')
  await stepToBank(page, mode)
  await expectStreetAxe(page)

  // 2. Arrive at the bank, enter, complete the lesson.
  await enterBank(page, mode)

  // 3. The scripted mistake: 2 stars and the matching review item.
  await playAttempt(page, mode, true)
  await expectResults(page, 2)
  const review = results(page).locator('li[data-severity]')
  await expect(review).toHaveCount(1)
  await expect(review).toContainText(TEXT.reviewMistake)
  if (options.reducedMotion) {
    await expect(results(page).locator('section[data-reduced-motion="true"]')).toBeVisible()
  }

  // 4. Retry: 3 stars. Best is 3, the first attempt is still 2.
  await activate(page, results(page).getByRole('button', { name: 'Try again' }), mode)
  await expect(results(page)).toHaveCount(0)
  await playAttempt(page, mode, false)
  await expectResults(page, 3)
  await expect(results(page).locator('li[data-severity]')).toHaveCount(0)
  const attempts = (await savedAttempts(page)).filter((a) => a.levelId === LEVEL_ID)
  expect(attempts.map((a) => a.stars)).toEqual([2, 3])

  await activate(page, results(page).getByRole('button', { name: 'Back to the street' }), mode)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(band(page)).not.toHaveAttribute('inert', /.*/)
  await expectStreetAxe(page)
  const bestStars = parseJson(await band(page).getAttribute('data-stars'))
  expect(bestStars).toEqual({ [LEVEL_ID]: 3 })

  // 5. The bank teller greets the player in the town.
  const visuals = parseJson(await band(page).getAttribute('data-visuals'))
  expect(visuals).toEqual({ bank: 'greets' })

  // 6. Reload: same location, stars and town change.
  const savedStars = await band(page).getAttribute('data-stars')
  await page.reload()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(page.getByTestId('profile-picker')).toHaveCount(0)
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await expect(band(page)).toHaveAttribute('data-stars', savedStars ?? '')
  expect(parseJson(await band(page).getAttribute('data-visuals'))).toEqual({ bank: 'greets' })
  const afterReload = (await savedAttempts(page)).filter((a) => a.levelId === LEVEL_ID)
  expect(afterReload.map((a) => a.stars)).toEqual([2, 3])
  await expectStreetAxe(page)

  // 7. The network-allowlist fixture (auto) fails the test if any request left the origin.
}

test.describe('demo journey, Level 2', () => {
  // Each run plays the level twice with axe on every screen: about 25 s on a quiet machine.
  test.setTimeout(90_000)

  test('pointer: swipe, bank, mistake, retry, reload', async ({ page }) => {
    await runJourney(page, 'pointer')
  })

  test('keyboard only: the whole journey without a pointer', async ({ page }) => {
    await runJourney(page, 'keyboard')
  })

  test('reduced motion: same journey, stars shown at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await runJourney(page, 'pointer', { reducedMotion: true })
  })

  test('reduced motion and keyboard together', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await runJourney(page, 'keyboard', { reducedMotion: true })
  })
})

test.describe('demo journey, known app gaps', () => {
  test('Level 2 lights a skill node that exists in the skill tree', () => {
    // Step 5, skill half. The skill-tree screen is not reachable from the running app, so
    // this checks the data that screen draws: every node Level 2 lights must exist in it.
    test.fixme(
      true,
      'Bug (owner P0-18 level content / skill-tree content): l02 declares skillNodes ' +
        '["bank.account"] but src/content/skillTree.ts only defines "access.identity" for ' +
        'Level 2 (LEVEL_SKILL_NODES), so completing Level 2 lights no node.',
    )
    const known = new Set(skillTree.nodes.map((node) => node.id as string))
    for (const id of level02.skillNodes) {
      expect(known.has(id as string), `skill node ${id}`).toBe(true)
    }
  })

  test('the app offers a way to open the skill tree after Level 2', async ({ page }) => {
    test.fixme(
      true,
      'Bug (owner P0-21 app shell / skill-tree screen wiring): SkillTreeScreen is only ' +
        'rendered by the dev gallery; neither the HUD nor the results screen opens it, so ' +
        'the player cannot see a lit node in the running app.',
    )
    await page.goto(APP_URL)
    await page.getByTestId('profile-new').click()
    await expect(band(page)).toHaveAttribute('data-ready', 'true')
    await page.getByRole('button', { name: /skill tree/i }).click()
    await expect(page.getByRole('heading', { name: 'Skill tree' })).toBeVisible()
  })

  test('street passes the strict shared axe harness', async ({ page }) => {
    test.fixme(
      true,
      'Bug (owner P0-22 location labels): the <ul> of DOM location labels is outside any ' +
        'landmark, so axe best-practice rule "region" fails on the street. The journey ' +
        'tests disable only that rule on street screens.',
    )
    await page.goto(APP_URL)
    await page.getByTestId('profile-new').click()
    await expect(band(page)).toHaveAttribute('data-ready', 'true')
    await expectNoAxeViolations(page)
  })
})

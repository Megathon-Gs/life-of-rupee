import { expect, test, type Page } from '@playwright/test'

/**
 * Visual baselines in test mode (`?test=1`): fixed seed, Pixi ticker stepped by hand,
 * reduced motion on so stars and transitions land in their end state. Baselines live in
 * tests/visual/visual.spec.ts-snapshots, one set per Playwright project.
 */

const APP_URL = '/?test=1'
const GALLERY_PORT = Number(process.env.VISUAL_GALLERY_PORT ?? 5197)

test.use({ reducedMotion: 'reduce' })

const band = (page: Page) => page.getByTestId('world-band')
const levelStep = (page: Page) => page.getByTestId('level-step')

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  // Two frames so layout and the manually stepped canvas have flushed.
  await page.evaluate(
    () =>
      new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
  )
}

async function startFreshProfile(page: Page) {
  await page.goto(APP_URL)
  await page.getByTestId('profile-new').click()
  await expect(band(page)).toHaveAttribute('data-ready', 'true')
  await expect(band(page)).toHaveAttribute('data-location', 'home')
  await expect(band(page)).toHaveAttribute('data-travelling', 'false')
}

async function openBank(page: Page) {
  await page.keyboard.press('ArrowRight')
  await expect(band(page)).toHaveAttribute('data-location', 'bank')
  await expect(band(page)).toHaveAttribute('data-travelling', 'false')
  await page.getByTestId('door-cue').click()
  await expect(levelStep(page)).toBeVisible()
}

const option = (page: Page, name: string) =>
  levelStep(page).getByRole('button', { name, exact: true })

async function advanceDialogue(page: Page, type: 'hook' | 'consequence') {
  for (let guard = 0; guard < 6; guard += 1) {
    if ((await levelStep(page).getAttribute('data-step-type')) !== type) return
    await levelStep(page)
      .getByRole('button', { name: /^(Continue|Done)$/ })
      .click()
    await page.waitForTimeout(50)
  }
}

test('street at the start of the journey', async ({ page }) => {
  await startFreshProfile(page)
  await settle(page)
  await expect(page).toHaveScreenshot('street.png')
})

test('bank panel with the Level 2 lesson', async ({ page }) => {
  await startFreshProfile(page)
  await openBank(page)
  await advanceDialogue(page, 'hook')
  await expect(levelStep(page)).toHaveAttribute('data-step-type', 'lesson')
  await settle(page)
  await expect(page).toHaveScreenshot('bank-panel.png')
})

test('results after the scripted mistake (2 stars, review card)', async ({ page }) => {
  await startFreshProfile(page)
  await openBank(page)
  await advanceDialogue(page, 'hook')
  await option(page, 'Choose Document type').click()
  await option(page, 'Adult account, no guardian details').click()
  await option(page, 'Minor account; follow bank and guardian requirements').click()
  await option(page, 'Passport — fictional sample').click()
  await advanceDialogue(page, 'consequence')
  // Test mode fixes the seed, so the transfer person is the same on every run.
  if (
    (await levelStep(page)
      .getByText(/Tara is 16/)
      .count()) > 0
  ) {
    await option(page, 'Minor account; follow bank and guardian requirements').click()
    await option(page, "Tara's passport — SAMPLE ONLY (TARA-DEMO)").click()
  } else {
    await option(page, 'Adult account, no guardian details').click()
    await option(page, "Arun's voter ID — SAMPLE ONLY (ARUN-DEMO)").click()
  }
  const results = page.getByTestId('results')
  await expect(results).toBeVisible()
  await expect(results.locator('[data-testid="result-star"][data-revealed="true"]')).toHaveCount(3)
  await settle(page)
  await expect(page).toHaveScreenshot('results.png')
})

test('skill tree screen (UI gallery, fixed fixture)', async ({ page }) => {
  // The running app has no route to the skill tree yet, so the baseline comes from the
  // gallery, which renders the real SkillTreeScreen with a fixed set of lit nodes.
  await page.goto(
    `http://127.0.0.1:${GALLERY_PORT}/src/ui/dev/gallery.html?surface=skilltree&locale=en`,
  )
  await page.locator('[data-ps-ui]').first().waitFor()
  await settle(page)
  await expect(page).toHaveScreenshot('skill-tree.png', { fullPage: true })
})

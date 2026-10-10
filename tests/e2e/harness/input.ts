import type { Page } from '@playwright/test'

export async function swipe(page: Page, dir: 'left' | 'right' | 'up' | 'down', px: number) {
  const { width, height } = page.viewportSize() ?? { width: 360, height: 740 }
  const start = { x: Math.round(width / 2), y: Math.round(height / 2) }
  const delta = { left: [-px, 0], right: [px, 0], up: [0, -px], down: [0, px] }[dir]

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x + delta[0], start.y + delta[1], { steps: 8 })
  await page.mouse.up()
}

export async function wheelBurst(page: Page, events: number, deltaPx: number, ms: number) {
  for (let index = 0; index < events; index += 1) {
    await page.mouse.wheel(0, deltaPx)
    if (index < events - 1 && ms > 0) await page.waitForTimeout(ms / events)
  }
}

export async function gotoTestMode(page: Page, path: string) {
  const url = new URL(path, page.url())
  url.searchParams.set('test', '1')
  await page.goto(url.toString())
}

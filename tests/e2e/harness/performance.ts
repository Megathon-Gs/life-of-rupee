import type { Page } from '@playwright/test'

export async function measureFps<T>(
  page: Page,
  fn: () => Promise<T>,
): Promise<{ result: T; fps: number }> {
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.evaluate(() => {
    const target = window as typeof window & { __fpsProbe?: { frames: number; running: boolean } }
    target.__fpsProbe = { frames: 0, running: true }
    const tick = () => {
      if (!target.__fpsProbe?.running) return
      target.__fpsProbe.frames += 1
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  const start = Date.now()
  try {
    const result = await fn()
    const elapsed = Math.max(Date.now() - start, 1)
    const frames = await page.evaluate(() => {
      const probe = (window as typeof window & { __fpsProbe?: { frames: number } }).__fpsProbe
      return probe?.frames ?? 0
    })
    return { result, fps: (frames * 1000) / elapsed }
  } finally {
    await page.evaluate(() => {
      const probe = (window as typeof window & { __fpsProbe?: { running: boolean } }).__fpsProbe
      if (probe) probe.running = false
    })
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await session.detach()
  }
}

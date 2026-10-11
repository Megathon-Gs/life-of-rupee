import gsap from 'gsap'
import type { LocationId } from '@/core/contracts'

/**
 * P1 signature transitions (product plan §5): the phone emerges into the UPI
 * panel at the phone shop, and the loan offers fan out at the showroom.
 * GSAP is the single animation clock (ADR-0003); reduced motion and `?test=1`
 * skip them so travel, screenshots and timing stay deterministic.
 */
export interface TransitionContext {
  reducedMotion: boolean
  test: boolean
}

const canAnimate = (ctx: TransitionContext) =>
  !ctx.test && !ctx.reducedMotion && typeof document !== 'undefined'

/** Waits a few frames for content the level panel mounts after the door opens. */
function whenPresent(selector: string, frames = 30): Promise<Element[]> {
  return new Promise((resolve) => {
    let left = frames
    const check = () => {
      const found = document.querySelectorAll(selector)
      if (found.length > 0 || left-- <= 0) resolve([...found])
      else requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

/** Called once the protagonist reaches a location. */
export async function onArrive(id: LocationId, ctx: TransitionContext): Promise<void> {
  void id
  void ctx
}

/** Called when the player goes through a door into a location's level. */
export async function enterLocation(id: LocationId, ctx: TransitionContext): Promise<void> {
  if (!canAnimate(ctx)) return
  if (id === 'phone-shop') {
    const [panel] = await whenPresent('[data-testid="level-step"]')
    if (!panel) return
    gsap.fromTo(
      panel,
      { scale: 0.7, y: 28, opacity: 0, transformOrigin: '50% 100%' },
      { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.4)', clearProps: 'all' },
    )
  } else if (id === 'showroom') {
    const cards = await whenPresent('[data-testid^="offer-"]')
    if (cards.length === 0) return
    gsap.fromTo(
      cards,
      { y: 18, opacity: 0, rotate: -3 },
      { y: 0, opacity: 1, rotate: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', clearProps: 'all' },
    )
  }
}

/** Called when the player leaves a location's level panel. */
export async function exitLocation(id: LocationId, ctx: TransitionContext): Promise<void> {
  void id
  void ctx
}
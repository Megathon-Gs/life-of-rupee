import gsap from 'gsap'
import type { LocationId } from '@/core/contracts'
import { interiors } from '@/content/interiors'

export { BANK_ENTRY_ID, cueDoor, transitionPanel } from '@/transitions'

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

const RECEIPT_LINE = '[data-testid^="line-"]'
const TIME_CHART = '[data-testid="time-chart"]'

let observer: MutationObserver | null = null
const animated = new WeakSet<Element>()
let running: gsap.core.Tween[] = []

function track(tween: gsap.core.Tween) {
  running.push(tween)
}

/** The receipt paper slides up into place. Visual only: never blocks input. */
function slideReceipt(paper: Element) {
  if (animated.has(paper)) return
  animated.add(paper)
  track(
    gsap.fromTo(
      paper,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', clearProps: 'transform,opacity' },
    ),
  )
}

/** Time-lapse: the chart columns grow from the baseline left to right. */
function playTimeLapse(chart: Element) {
  if (animated.has(chart)) return
  animated.add(chart)
  const columns = [...chart.children]
  if (columns.length === 0) return
  track(
    gsap.fromTo(
      columns,
      { scaleY: 0, opacity: 0.3, transformOrigin: '50% 100%' },
      {
        scaleY: 1,
        opacity: 1,
        duration: 0.3,
        stagger: Math.min(0.05, 0.4 / columns.length),
        ease: 'power2.out',
        clearProps: 'transform,opacity,transformOrigin',
      },
    ),
  )
}

function scan(root: ParentNode) {
  const line = root.querySelector?.(RECEIPT_LINE)
  const paper = line?.closest('ul')
  if (paper) slideReceipt(paper)
  const chart = root.querySelector?.(TIME_CHART)
  if (chart) playTimeLapse(chart)
}

function stopWatching() {
  observer?.disconnect()
  observer = null
  for (const tween of running) {
    const targets = tween.targets() as Element[]
    if (targets.some((t) => !t.isConnected)) tween.kill()
  }
  running = []
}

/** Watches for P2 interactions mounting at any step of the level. */
function watchInteractions() {
  stopWatching()
  scan(document.body)
  observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue
        const el = node as Element
        if (el.matches(RECEIPT_LINE)) {
          const paper = el.closest('ul')
          if (paper) slideReceipt(paper)
        }
        if (el.matches(TIME_CHART)) playTimeLapse(el)
        scan(el)
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

/** Called when the player goes through a door into a location's level. */
export async function enterLocation(id: LocationId, ctx: TransitionContext): Promise<void> {
  if (!canAnimate(ctx)) return
  watchInteractions()
  // Locations with an interior backdrop use the P2-30 CSS reveal instead.
  if (interiors[id]) return
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
      {
        y: 0,
        opacity: 1,
        rotate: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: 'power2.out',
        clearProps: 'all',
      },
    )
  }
}

/** Called when the player leaves a location's level panel. */
export async function exitLocation(id: LocationId, ctx: TransitionContext): Promise<void> {
  void id
  void ctx
  stopWatching()
}

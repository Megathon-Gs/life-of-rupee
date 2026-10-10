import gsap from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

export const BANK_ENTRY_ID = 'bank-entry'

interface PanelTransition {
  door: DOMRect
  panel: HTMLElement
  reducedMotion: boolean
  seen: boolean
  reverse?: boolean
  test?: boolean
  signal: AbortSignal
  onSkipReady: (skip: (() => void) | null) => void
}

/** One clock owns the proxy and panel, including skip and unmount cleanup. */
export function transitionPanel(options: PanelTransition): Promise<void> {
  const { door, panel, reducedMotion, seen, reverse = false, test, signal, onSkipReady } = options
  if (signal.aborted) return Promise.resolve()
  const proxy = document.createElement('div')
  proxy.setAttribute('aria-hidden', 'true')
  proxy.dataset.testid = 'bank-transition-proxy'
  const surface = getComputedStyle(panel)
  Object.assign(proxy.style, {
    position: 'fixed',
    zIndex: '0',
    pointerEvents: 'none',
    background: surface.backgroundColor,
    boxShadow: surface.boxShadow,
  })
  let animation: gsap.core.Animation
  return new Promise((resolve) => {
    const originalStyle = panel.getAttribute('style')
    const contents = [...panel.children].slice(0, 2) as HTMLElement[]
    const originalContents = contents.map((element) => element.getAttribute('style'))
    const finish = () => {
      signal.removeEventListener('abort', cancel)
      animation?.kill()
      proxy.remove()
      if (originalStyle === null) panel.removeAttribute('style')
      else panel.setAttribute('style', originalStyle)
      if (!signal.aborted) panel.style.animation = 'none'
      contents.forEach((element, index) => {
        const style = originalContents[index]
        if (style == null) element.removeAttribute('style')
        else element.setAttribute('style', style)
      })
      onSkipReady(null)
      resolve()
    }
    const cancel = () => finish()
    signal.addEventListener('abort', cancel, { once: true })
    panel.style.animation = 'none'
    const panelRect = panel.getBoundingClientRect()
    if (reducedMotion) {
      animation = gsap.fromTo(
        panel,
        { opacity: reverse ? 1 : 0 },
        {
          opacity: reverse ? 0 : 1,
          duration: 0.15,
          onComplete: finish,
        },
      )
    } else {
      panel.parentElement?.append(proxy)
      const source = reverse ? panelRect : door
      const destination = reverse ? door : panelRect
      gsap.set(proxy, {
        left: source.left,
        top: source.top,
        width: source.width,
        height: source.height,
      })
      const state = Flip.getState(proxy)
      gsap.set(proxy, {
        left: destination.left,
        top: destination.top,
        width: destination.width,
        height: destination.height,
      })
      // Keep the repeat-visit Skip footer visible and inside the modal's focus trap.
      panel.style.background = 'transparent'
      panel.style.boxShadow = 'none'
      panel.style.zIndex = '1'
      gsap.set(contents, { opacity: 0 })
      const timeline = gsap.timeline({ onComplete: finish })
      animation = timeline
      timeline.add(Flip.from(state, { duration: reverse ? 0.45 : 0.9, ease: 'power2.inOut' }), 0)
      if (!reverse) timeline.to(contents, { opacity: 1, duration: 0.15 }, 0.75)
      if (seen && !reverse) onSkipReady(() => timeline.progress(1))
    }
    if (test) animation.progress(1)
  })
}

/** Reduced-motion players get focus and a static highlight, never a pulse. */
export function cueDoor(door: HTMLElement | null, reducedMotion: boolean): () => void {
  if (!door || reducedMotion) return () => {}
  const animation = gsap.fromTo(
    door,
    { scale: 0.96 },
    {
      scale: 1,
      duration: 0.3,
      repeat: 1,
      yoyo: true,
      onComplete: () => gsap.set(door, { clearProps: 'transform' }),
    },
  )
  return () => {
    animation.kill()
    gsap.set(door, { clearProps: 'transform' })
  }
}

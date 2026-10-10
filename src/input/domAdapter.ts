import type { TravelCommand } from '@/core/contracts'
import { INPUT_CONFIG, type InputConfig } from './config'
import type { TravelMachine } from './travelMachine'

const isEditable = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

/**
 * Wires the world band's wheel, pointer and arrow-key input into `machine`. Buttons, building
 * taps, `travelDone` and panel events are sent to the machine by their owners. Returns a
 * function that removes every listener and restores `touch-action`.
 */
export function attachTravelInput(
  el: HTMLElement,
  machine: TravelMachine,
  onCommand: (cmd: TravelCommand) => void,
  config: InputConfig = INPUT_CONFIG,
): () => void {
  const doc = el.ownerDocument
  const prevTouchAction = el.style.touchAction
  el.style.touchAction = 'none'

  const emit = (cmd: TravelCommand | null): boolean => {
    if (cmd) onCommand(cmd)
    return cmd !== null
  }

  const onWheel = (e: WheelEvent) => {
    // Leave pinch-zoom (ctrl+wheel) to the browser.
    if (e.ctrlKey) return
    e.preventDefault()
    const scale =
      e.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? config.wheelLinePx
        : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? el.clientHeight
          : 1
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    emit(machine.send({ kind: 'wheel', deltaY: delta * scale, t: e.timeStamp }))
  }

  let start: { id: number; x: number; y: number; t: number; target: Element } | null = null
  const onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary || e.button !== 0) return
    // Keep hotspot clicks targeted at the original element, not the world band.
    const target = e.target instanceof Element ? e.target : el
    start = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, target }
    target.setPointerCapture?.(e.pointerId)
  }
  const releasePointer = () => {
    if (start && start.target.hasPointerCapture?.(start.id)) {
      start.target.releasePointerCapture(start.id)
    }
    start = null
  }
  const onPointerUp = (e: PointerEvent) => {
    if (!start || e.pointerId !== start.id) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const durationMs = Math.max(0, e.timeStamp - start.t)
    releasePointer()
    // Within the slop it is a tap; the hotspot's own click handler deals with it.
    if (Math.hypot(dx, dy) < config.tapSlopPx) return
    emit(machine.send({ kind: 'swipe', dx, dy, durationMs }))
  }
  const onPointerCancel = (e: PointerEvent) => {
    if (start && e.pointerId === start.id) releasePointer()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    // Enter is left alone so it reaches the focused door hotspot.
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    if (e.altKey || e.ctrlKey || e.metaKey || isEditable(e.target)) return
    if (emit(machine.send({ kind: 'key', key: e.key }))) e.preventDefault()
  }

  el.addEventListener('wheel', onWheel, { passive: false })
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('pointercancel', onPointerCancel)
  doc.addEventListener('keydown', onKeyDown)

  return () => {
    releasePointer()
    el.removeEventListener('wheel', onWheel)
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerCancel)
    doc.removeEventListener('keydown', onKeyDown)
    el.style.touchAction = prevTouchAction
  }
}

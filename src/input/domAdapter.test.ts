import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TravelCommand } from '@/core/contracts'
import { attachTravelInput } from './domAdapter'
import { createTravelMachine } from './travelMachine'

let detach: (() => void) | undefined
afterEach(() => {
  detach?.()
  detach = undefined
  document.body.innerHTML = ''
})

const setup = () => {
  const el = document.createElement('div')
  document.body.append(el)
  const machine = createTravelMachine()
  const send = vi.spyOn(machine, 'send')
  const commands: TravelCommand[] = []
  detach = attachTravelInput(el, machine, (c) => commands.push(c))
  return { el, send, commands }
}

const pointer = (type: string, x: number, y: number) =>
  new PointerEvent(type, { clientX: x, clientY: y, isPrimary: true, pointerId: 1, bubbles: true })

describe('attachTravelInput', () => {
  it('sets touch-action: none and restores it on detach', () => {
    const { el } = setup()
    expect(el.style.touchAction).toBe('none')
    detach!()
    detach = undefined
    expect(el.style.touchAction).toBe('')
  })

  it('wheel: prevents default and emits one step', () => {
    const { el, commands } = setup()
    const e = new WheelEvent('wheel', { deltaY: 80, cancelable: true })
    el.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    expect(commands).toEqual([{ kind: 'step', dir: 1 }])
  })

  it('wheel: converts line deltas to pixels and leaves ctrl+wheel zoom alone', () => {
    const { el, send } = setup()
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, cancelable: true }))
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'wheel', deltaY: 48 }))
    const zoom = new WheelEvent('wheel', { deltaY: 100, ctrlKey: true, cancelable: true })
    el.dispatchEvent(zoom)
    expect(zoom.defaultPrevented).toBe(false)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('pointer drag becomes one swipe; a small movement is a tap and sends nothing', () => {
    const { el, send, commands } = setup()
    el.dispatchEvent(pointer('pointerdown', 100, 300))
    el.dispatchEvent(pointer('pointerup', 104, 297))
    expect(send).not.toHaveBeenCalled()

    el.dispatchEvent(pointer('pointerdown', 100, 300))
    el.dispatchEvent(pointer('pointerup', 100, 200))
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'swipe', dx: 0, dy: -100 }))
    expect(commands).toEqual([{ kind: 'step', dir: 1 }])
  })

  it('pointercancel abandons the gesture', () => {
    const { el, send } = setup()
    el.dispatchEvent(pointer('pointerdown', 100, 300))
    el.dispatchEvent(pointer('pointercancel', 100, 300))
    el.dispatchEvent(pointer('pointerup', 100, 100))
    expect(send).not.toHaveBeenCalled()
  })

  it('captures a drag and releases it on up, cancel and detach', () => {
    const { el, send } = setup()
    const setPointerCapture = vi.fn()
    const releasePointerCapture = vi.fn()
    Object.assign(el, {
      setPointerCapture,
      hasPointerCapture: () => true,
      releasePointerCapture,
    })
    el.dispatchEvent(pointer('pointerdown', 100, 300))
    expect(setPointerCapture).toHaveBeenCalledWith(1)
    // Captured events still target the band when the pointer is outside its bounds.
    el.dispatchEvent(pointer('pointerup', 100, -100))
    expect(releasePointerCapture).toHaveBeenCalledWith(1)
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'swipe', dy: -400 }))

    el.dispatchEvent(pointer('pointerdown', 100, 300))
    el.dispatchEvent(pointer('pointercancel', 100, 300))
    expect(releasePointerCapture).toHaveBeenCalledTimes(2)
    el.dispatchEvent(pointer('pointerup', 100, -100))
    expect(send).toHaveBeenCalledTimes(1)

    el.dispatchEvent(pointer('pointerdown', 100, 300))
    detach!()
    detach = undefined
    expect(releasePointerCapture).toHaveBeenCalledTimes(3)
  })

  it('captures on the original hotspot so a tap retains its click target', () => {
    const { el, send } = setup()
    const hotspot = document.createElement('button')
    el.append(hotspot)
    const setPointerCapture = vi.fn()
    const releasePointerCapture = vi.fn()
    Object.assign(hotspot, {
      setPointerCapture,
      hasPointerCapture: () => true,
      releasePointerCapture,
    })
    hotspot.dispatchEvent(pointer('pointerdown', 100, 300))
    hotspot.dispatchEvent(pointer('pointerup', 100, 300))
    expect(setPointerCapture).toHaveBeenCalledWith(1)
    expect(releasePointerCapture).toHaveBeenCalledWith(1)
    expect(send).not.toHaveBeenCalled()
  })

  it('arrow keys step; Enter and keys typed into inputs are left alone', () => {
    const { send, commands } = setup()
    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
    document.dispatchEvent(right)
    expect(right.defaultPrevented).toBe(true)
    expect(commands).toEqual([{ kind: 'step', dir: 1 }])

    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
    document.dispatchEvent(enter)
    expect(enter.defaultPrevented).toBe(false)

    const input = document.createElement('input')
    document.body.append(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('detach removes every listener', () => {
    const { el, send } = setup()
    detach!()
    detach = undefined
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: 80, cancelable: true }))
    el.dispatchEvent(pointer('pointerdown', 0, 300))
    el.dispatchEvent(pointer('pointerup', 0, 100))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(send).not.toHaveBeenCalled()
  })
})

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

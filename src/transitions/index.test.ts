import { afterEach, describe, expect, it, vi } from 'vitest'
import gsap from 'gsap'
import { cueDoor, transitionPanel } from './index'

describe('bank transition', () => {
  afterEach(() => document.body.replaceChildren())

  function setup(seen = false, reducedMotion = false, test = false) {
    const panel = document.createElement('div')
    panel.innerHTML = '<header></header><main></main>'
    document.body.append(panel)
    const controller = new AbortController()
    const onSkipReady = vi.fn()
    return {
      panel,
      controller,
      onSkipReady,
      options: {
        door: new DOMRect(100, 100, 80, 40),
        panel,
        signal: controller.signal,
        onSkipReady,
        seen,
        reducedMotion,
        test,
      },
    }
  }

  it('does not offer Skip on the first visit and cleans up on cancellation', async () => {
    const { options, controller, onSkipReady, panel } = setup()
    panel.style.color = 'red'
    const finished = transitionPanel(options)
    expect(onSkipReady).not.toHaveBeenCalled()
    expect(document.querySelector('[data-testid="bank-transition-proxy"]')).not.toBeNull()
    controller.abort()
    await finished
    expect(document.querySelector('[data-testid="bank-transition-proxy"]')).toBeNull()
    expect(panel.style.color).toBe('red')
    expect(panel.style.opacity).toBe('')
  })

  it('Skip completes the whole repeat transition and removes its proxy', async () => {
    const { options, onSkipReady, panel } = setup(true)
    const finished = transitionPanel(options)
    onSkipReady.mock.calls[0]![0]()
    await finished
    expect(panel.style.opacity).toBe('')
    expect(onSkipReady).toHaveBeenLastCalledWith(null)
    expect(document.querySelector('[data-testid="bank-transition-proxy"]')).toBeNull()
  })

  it('reduced motion uses only a 150 ms fade, also on exit', async () => {
    const { options, panel } = setup(false, true)
    const finished = transitionPanel({ ...options, reverse: true })
    const animation = gsap.getTweensOf(panel)[0]!
    expect(animation.duration()).toBe(0.15)
    expect(document.querySelector('[data-testid="bank-transition-proxy"]')).toBeNull()
    animation.progress(1)
    await finished
    expect(panel.style.opacity).toBe('')
  })

  it('test mode jumps directly to a clean end state', async () => {
    const { options, panel } = setup(false, false, true)
    await transitionPanel(options)
    expect(panel.style.opacity).toBe('')
    expect(document.querySelector('[data-testid="bank-transition-proxy"]')).toBeNull()
  })

  it('never pulses the reduced-motion arrival cue', () => {
    const door = document.createElement('button')
    const cleanup = cueDoor(door, true)
    expect(gsap.getTweensOf(door)).toHaveLength(0)
    cleanup()
  })
})

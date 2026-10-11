import { afterEach, describe, expect, it, vi } from 'vitest'
import gsap from 'gsap'
import type { LocationId } from '@/core/contracts'
import { enterLocation, exitLocation } from './transitions'

const on = { reducedMotion: false, test: false }
const id = (v: string) => v as LocationId
const tick = () => new Promise((r) => setTimeout(r, 0))

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('P2 signature transitions', () => {
  it('does nothing when animation is disabled', async () => {
    const observe = vi.spyOn(MutationObserver.prototype, 'observe')
    const from = vi.spyOn(gsap, 'fromTo')
    await enterLocation(id('market'), { reducedMotion: true, test: false })
    await enterLocation(id('market'), { reducedMotion: false, test: true })
    expect(observe).not.toHaveBeenCalled()
    expect(from).not.toHaveBeenCalled()
  })

  it('slides the receipt up and plays the time-lapse once each', async () => {
    const from = vi.spyOn(gsap, 'fromTo').mockReturnValue({ targets: () => [] } as never)
    await enterLocation(id('market'), on)
    const ul = document.createElement('ul')
    ul.innerHTML = '<li data-testid="line-a"></li>'
    const chart = document.createElement('div')
    chart.dataset.testid = 'time-chart'
    chart.innerHTML = '<span></span><span></span>'
    document.body.append(ul, chart)
    await tick()
    expect(from).toHaveBeenCalledTimes(2)
    expect(from.mock.calls[0][0]).toBe(ul)
    document.body.append(document.createElement('p'))
    await tick()
    expect(from).toHaveBeenCalledTimes(2)
    await exitLocation(id('market'), on)
  })

  it('disconnects the observer on exit and when re-entering', async () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect')
    await enterLocation(id('market'), on)
    await enterLocation(id('market'), on)
    expect(disconnect).toHaveBeenCalledTimes(1)
    await exitLocation(id('market'), on)
    expect(disconnect).toHaveBeenCalledTimes(2)
  })

  it('skips the P1 phone pop where an interior exists', async () => {
    const from = vi.spyOn(gsap, 'fromTo')
    const step = document.createElement('div')
    step.dataset.testid = 'level-step'
    document.body.append(step)
    await enterLocation(id('phone-shop'), on)
    await tick()
    expect(from).not.toHaveBeenCalled()
    await exitLocation(id('phone-shop'), on)
  })
})

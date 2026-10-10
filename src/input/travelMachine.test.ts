import { describe, expect, it } from 'vitest'
import type { LocationId, TravelCommand } from '@/core/contracts'
import { createTravelMachine, type MachineEvent, type TravelMachine } from './travelMachine'

const run = (m: TravelMachine, events: MachineEvent[]): TravelCommand[] =>
  events.map((e) => m.send(e)).filter((c): c is TravelCommand => c !== null)

/** `n` wheel events of `px` each, evenly spread over `spanMs` starting at `t0`. */
const burst = (t0: number, n = 30, px = 20, spanMs = 400): MachineEvent[] =>
  Array.from({ length: n }, (_, i) => ({ kind: 'wheel', deltaY: px, t: t0 + (i * spanMs) / n }))

const bank = 'bank' as LocationId
const fwd = { kind: 'step', dir: 1 }
const back = { kind: 'step', dir: -1 }

describe('wheel', () => {
  it('30 events × 20 px within 400 ms → exactly 1 command', () => {
    expect(run(createTravelMachine(), burst(0))).toEqual([fwd])
  })

  it('needs 60 px before firing; negative deltas step back', () => {
    const m = createTravelMachine()
    expect(run(m, [{ kind: 'wheel', deltaY: -59, t: 0 }])).toEqual([])
    expect(run(m, [{ kind: 'wheel', deltaY: -1, t: 10 }])).toEqual([back])
  })

  it('a burst ≥ 200 ms after travelDone fires again; one at 150 ms does not', () => {
    const m = createTravelMachine()
    run(m, burst(0))
    run(m, [{ kind: 'travelDone', t: 1000 }])
    expect(run(m, burst(1150))).toEqual([])

    const m2 = createTravelMachine()
    run(m2, burst(0))
    run(m2, [{ kind: 'travelDone', t: 1000 }])
    expect(run(m2, burst(1200))).toEqual([fwd])
  })

  it('wheel events in the quiet window restart it (inertia tail)', () => {
    const m = createTravelMachine()
    run(m, burst(0))
    run(m, [{ kind: 'travelDone', t: 1000 }])
    // Inertia tail every 100 ms until 1500 ms, then a fresh flick 150 ms later.
    const tail: MachineEvent[] = [1100, 1200, 1300, 1400, 1500].map((t) => ({
      kind: 'wheel',
      deltaY: 5,
      t,
    }))
    expect(run(m, [...tail, ...burst(1650)])).toEqual([])
  })

  it('quiet window counts from the last wheel event if it came after travelDone', () => {
    const m = createTravelMachine()
    run(m, burst(0)) // last event at ~387 ms, still travelling
    run(m, [{ kind: 'travelDone', t: 300 }])
    expect(run(m, [{ kind: 'wheel', deltaY: 60, t: 550 }])).toEqual([])
  })

  it('a partial sum is forgotten after a quiet gap', () => {
    const m = createTravelMachine()
    expect(run(m, [{ kind: 'wheel', deltaY: 40, t: 0 }])).toEqual([])
    expect(run(m, [{ kind: 'wheel', deltaY: 40, t: 500 }])).toEqual([])
  })
})

describe('swipe', () => {
  const slow = 500 // 39 px / 500 ms is well below 0.3 px/ms
  it('39 px → none; 41 px → 1 command', () => {
    expect(
      run(createTravelMachine(), [{ kind: 'swipe', dx: 0, dy: -39, durationMs: slow }]),
    ).toEqual([])
    expect(
      run(createTravelMachine(), [{ kind: 'swipe', dx: 0, dy: -41, durationMs: slow }]),
    ).toEqual([fwd])
  })

  it('up and left are forward; down and right are back', () => {
    const one = (dx: number, dy: number) =>
      createTravelMachine().send({ kind: 'swipe', dx, dy, durationMs: slow })
    expect(one(0, -50)).toEqual(fwd)
    expect(one(-50, 0)).toEqual(fwd)
    expect(one(0, 50)).toEqual(back)
    expect(one(50, 0)).toEqual(back)
  })

  it('uses the dominant axis', () => {
    // Mostly horizontal to the right with a little upward drift → back.
    expect(
      createTravelMachine().send({ kind: 'swipe', dx: 60, dy: -30, durationMs: slow }),
    ).toEqual(back)
  })

  it('a short but fast flick counts (≥ 0.3 px/ms)', () => {
    const m = createTravelMachine()
    expect(m.send({ kind: 'swipe', dx: 0, dy: -30, durationMs: 100 })).toEqual(fwd)
    expect(createTravelMachine().send({ kind: 'swipe', dx: 0, dy: -30, durationMs: 101 })).toBe(
      null,
    )
  })

  it('is ignored while travelling and accepted right after travelDone', () => {
    const m = createTravelMachine()
    const s: MachineEvent = { kind: 'swipe', dx: 0, dy: -80, durationMs: 200 }
    expect(run(m, [s, s])).toEqual([fwd])
    expect(run(m, [{ kind: 'travelDone', t: 1000 }, s])).toEqual([fwd])
  })
})

describe('keys, buttons, taps', () => {
  it('arrow keys and buttons step once; Enter is ignored', () => {
    const m = createTravelMachine()
    const done: MachineEvent = { kind: 'travelDone', t: 0 }
    expect(
      run(m, [
        { kind: 'key', key: 'ArrowRight' },
        done,
        { kind: 'key', key: 'ArrowLeft' },
        done,
        { kind: 'button', dir: 1 },
        done,
        { kind: 'button', dir: -1 },
        done,
        { kind: 'key', key: 'Enter' },
      ]),
    ).toEqual([fwd, back, fwd, back])
  })

  it('tap on bank → goto bank', () => {
    expect(createTravelMachine().send({ kind: 'tap', id: bank })).toEqual({
      kind: 'goto',
      id: 'bank',
    })
  })
})

describe('panel', () => {
  it('panelOpened ignores wheel, swipe, keys, buttons and taps until panelClosed', () => {
    const m = createTravelMachine()
    const inputs: MachineEvent[] = [
      ...burst(0),
      { kind: 'swipe', dx: 0, dy: -100, durationMs: 100 },
      { kind: 'key', key: 'ArrowRight' },
      { kind: 'button', dir: 1 },
      { kind: 'tap', id: bank },
    ]
    expect(run(m, [{ kind: 'panelOpened' }, ...inputs])).toEqual([])
    expect(run(m, [{ kind: 'panelClosed' }, { kind: 'key', key: 'ArrowRight' }])).toEqual([fwd])
  })

  it('wheel sum from before the panel opened is discarded', () => {
    const m = createTravelMachine()
    run(m, [{ kind: 'wheel', deltaY: 50, t: 0 }, { kind: 'panelOpened' }, { kind: 'panelClosed' }])
    expect(m.send({ kind: 'wheel', deltaY: 20, t: 50 })).toBe(null)
  })
})

describe('config', () => {
  it('honours custom thresholds', () => {
    const m = createTravelMachine({
      wheelThresholdPx: 100,
      quietWindowMs: 200,
      swipeMinPx: 40,
      swipeMinPxPerMs: 0.3,
    })
    expect(run(m, burst(0, 4, 20, 40))).toEqual([])
    expect(m.send({ kind: 'wheel', deltaY: 20, t: 50 })).toEqual(fwd)
  })
})

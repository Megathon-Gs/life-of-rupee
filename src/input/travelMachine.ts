import type { TravelCommand, TravelInput } from '@/core/contracts'
import { DEFAULT_TRAVEL_CONFIG, type TravelConfig } from './config'

/**
 * Contract input plus the lifecycle events the machine needs. `t` is milliseconds on the
 * `performance.now()` / `Event.timeStamp` clock.
 */
export type MachineEvent =
  | TravelInput
  | { kind: 'travelDone'; t: number }
  | { kind: 'panelOpened' }
  | { kind: 'panelClosed' }

/** Turns normalized input into at most one travel command per deliberate gesture. */
export interface TravelMachine {
  /** Feed one event; returns the command it triggers, if any. */
  send(event: MachineEvent): TravelCommand | null
}

// idle: everything accepted. travelling: a command is in flight, everything ignored until
// `travelDone`. settling: travel finished, but wheel input waits for a quiet window so
// trackpad inertia cannot trigger a second step.
type Phase = 'idle' | 'travelling' | 'settling'

/**
 * Pure travel state machine. Enter is deliberately ignored: on arrival the door hotspot is
 * the focused control, so Enter activates it through normal browser behaviour.
 */
export function createTravelMachine(config: TravelConfig = DEFAULT_TRAVEL_CONFIG): TravelMachine {
  let phase: Phase = 'idle'
  let panelOpen = false
  let wheelSum = 0
  let lastWheelT = -Infinity
  let quietFrom = -Infinity

  const fire = (cmd: TravelCommand): TravelCommand => {
    phase = 'travelling'
    wheelSum = 0
    return cmd
  }

  const onWheel = (deltaY: number, t: number): TravelCommand | null => {
    const sinceLast = t - lastWheelT
    lastWheelT = t
    if (phase === 'travelling') return null
    if (phase === 'settling') {
      // Any wheel event inside the window restarts it.
      if (t - quietFrom < config.quietWindowMs) {
        quietFrom = t
        return null
      }
      phase = 'idle'
    } else if (sinceLast >= config.quietWindowMs) {
      wheelSum = 0
    }
    wheelSum += deltaY
    if (Math.abs(wheelSum) < config.wheelThresholdPx) return null
    return fire({ kind: 'step', dir: wheelSum > 0 ? 1 : -1 })
  }

  const onSwipe = (dx: number, dy: number, durationMs: number): TravelCommand | null => {
    const vertical = Math.abs(dy) >= Math.abs(dx)
    const d = vertical ? dy : dx
    const dist = Math.abs(d)
    if (dist === 0) return null
    const fastEnough = durationMs > 0 && dist / durationMs >= config.swipeMinPxPerMs
    if (dist < config.swipeMinPx && !fastEnough) return null
    // Finger up or left moves forward, like scrolling a page.
    return fire({ kind: 'step', dir: d < 0 ? 1 : -1 })
  }

  return {
    send(event) {
      switch (event.kind) {
        case 'panelOpened':
          panelOpen = true
          wheelSum = 0
          return null
        case 'panelClosed':
          panelOpen = false
          return null
        case 'travelDone':
          if (phase === 'travelling') {
            phase = 'settling'
            quietFrom = Math.max(event.t, lastWheelT)
          }
          return null
      }
      if (panelOpen) return null
      if (event.kind === 'wheel') return onWheel(event.deltaY, event.t)
      if (phase === 'travelling') return null
      switch (event.kind) {
        case 'swipe':
          return onSwipe(event.dx, event.dy, event.durationMs)
        case 'key':
          if (event.key === 'ArrowRight') return fire({ kind: 'step', dir: 1 })
          if (event.key === 'ArrowLeft') return fire({ kind: 'step', dir: -1 })
          return null
        case 'button':
          return fire({ kind: 'step', dir: event.dir })
        case 'tap':
          return fire({ kind: 'goto', id: event.id })
      }
    },
  }
}

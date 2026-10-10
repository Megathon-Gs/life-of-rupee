import { DEFAULT_TRAVEL_CONFIG, type TravelConfig } from '@/core/contracts'

export { DEFAULT_TRAVEL_CONFIG, type TravelConfig }

/** Every input threshold in one place: the contract defaults plus DOM-adapter-only values. */
export type InputConfig = TravelConfig & {
  /** A pointer that never leaves this radius is a tap or click, not a swipe. */
  tapSlopPx: number
  /** Pixels per line for `WheelEvent.DOM_DELTA_LINE` (Firefox mouse wheels). */
  wheelLinePx: number
}

/** Defaults; tune on a real Android phone and record the final values in the PR. */
export const INPUT_CONFIG: InputConfig = {
  ...DEFAULT_TRAVEL_CONFIG,
  tapSlopPx: 10,
  wheelLinePx: 16,
}

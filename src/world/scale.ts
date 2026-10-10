/**
 * Scale maths for the 270 px logical stage. Everything is authored on a 16 px tile
 * grid at LOGICAL_HEIGHT and blown up by a whole-number factor so pixels stay crisp.
 */

/** Logical height of the world stage in pixels (16 px tile grid). */
export const LOGICAL_HEIGHT = 270

/** A viewport measured in device pixels, plus its orientation. */
export interface Viewport {
  width: number
  height: number
}

/** Whole-number scale factor: floor of the band height, never below 1. */
export function scaleFor(bandHeightDevicePx: number): number {
  return Math.max(1, Math.floor(bandHeightDevicePx / LOGICAL_HEIGHT))
}

/** Logical viewport width in world pixels for an integer scale factor. */
export function logicalWidth(viewportWidthDevicePx: number, scaled: number): number {
  return viewportWidthDevicePx / scaled
}

/** World band height in device px: all of the height in landscape, 60% in portrait. */
export function bandHeight(viewport: Viewport): number {
  return Math.round(viewport.width >= viewport.height ? viewport.height : viewport.height * 0.6)
}

/** Device px of extra sky above a bottom-anchored stage: the band minus its whole-scale stage. */
export function stageOffsetY(bandDeviceHeight: number, scaled: number): number {
  return Math.max(0, Math.round(bandDeviceHeight) - LOGICAL_HEIGHT * scaled)
}

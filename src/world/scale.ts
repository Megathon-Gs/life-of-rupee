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

/** Where the ground line sits in the viewport when the stage is not bottom-pinned. */
const GROUND_LINE_RATIO = 0.8
/** Ground line inside the logical stage (mirrors `GROUND_Y` in textures). */
const STAGE_GROUND_Y = 210

/**
 * Device-px offset of the stage top. The stage is moved up so the ground line sits near 80% of
 * the viewport (clear of the bottom controls), never lower than bottom-pinned. The world art
 * extends above (sky) and below (road) the stage to reach every edge.
 */
export function stageOffsetY(viewportDeviceHeight: number, scaled: number): number {
  const height = Math.round(viewportDeviceHeight)
  const pinned = height - LOGICAL_HEIGHT * scaled
  const grounded = Math.round(height * GROUND_LINE_RATIO) - STAGE_GROUND_Y * scaled
  return Math.max(0, Math.min(pinned, grounded))
}

/** Whole logical rows of world needed above the stage and below it to fill the viewport. */
export function stageExtents(
  viewportDeviceHeight: number,
  scaled: number,
  bottomInset = 0,
): { top: number; bottom: number } {
  const offset = stageOffsetY(viewportDeviceHeight - bottomInset, scaled)
  const below = Math.max(0, Math.round(viewportDeviceHeight) - offset - LOGICAL_HEIGHT * scaled)
  return { top: Math.ceil(offset / scaled), bottom: Math.ceil(below / scaled) }
}

/** Portrait scale targets this share of the viewport height for the stage. */
const PORTRAIT_STAGE_RATIO = 0.72
/** Narrowest logical width that still shows about two buildings across. */
const MIN_LOGICAL_WIDTH = 210

/**
 * Whole-number scale for a viewport in device px. Landscape fits the full height. Portrait takes
 * the larger of the height fit, but never so large that fewer than ~2 buildings fit across.
 */
export function fitScale(viewport: Viewport): number {
  if (viewport.width >= viewport.height) return scaleFor(viewport.height)
  const byHeight = scaleFor(Math.round(viewport.height * PORTRAIT_STAGE_RATIO))
  const byWidth = Math.max(1, Math.floor(viewport.width / MIN_LOGICAL_WIDTH))
  return Math.max(1, Math.min(byHeight, byWidth))
}

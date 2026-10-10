import './fonts.css'
import './tokens.css'
import './base.css'

/** Logical size of the pixel world; the renderer scales it by integers only. */
export const WORLD = { width: 480, height: 270, tile: 16 } as const

/** Delay between ResultsScreen star reveals, matching `--dur-star`. */
export const STAR_REVEAL_MS = 420

/** Largest whole-number scale at which the world band fits the given box (min 1). */
export function integerWorldScale(boxWidth: number, boxHeight: number): number {
  return Math.max(1, Math.floor(Math.min(boxWidth / WORLD.width, boxHeight / WORLD.height)))
}

/** Settings text sizes, mirrored by `[data-text-scale]` in tokens.css. */
export const TEXT_SCALES = [1, 1.25, 1.5] as const

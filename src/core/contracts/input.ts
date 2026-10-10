import { z } from 'zod'
import { LocationIdSchema } from './ids'

/** Schema for a travel command. */
export const TravelCommandSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('step'), dir: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ kind: z.literal('goto'), id: LocationIdSchema }),
])
/** One deliberate travel gesture: step one stop or go to a location. */
export type TravelCommand = z.infer<typeof TravelCommandSchema>

/** Schema for normalized raw travel input. */
export const TravelInputSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('wheel'), deltaY: z.number(), t: z.number() }),
  z.object({
    kind: z.literal('swipe'),
    dx: z.number(),
    dy: z.number(),
    durationMs: z.number().nonnegative(),
  }),
  z.object({ kind: z.literal('key'), key: z.enum(['ArrowLeft', 'ArrowRight', 'Enter']) }),
  z.object({ kind: z.literal('button'), dir: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ kind: z.literal('tap'), id: LocationIdSchema }),
])
/** Normalized wheel, swipe, key, button or tap event fed to the travel controller. */
export type TravelInput = z.infer<typeof TravelInputSchema>

/** Schema for travel-controller thresholds. */
export const TravelConfigSchema = z
  .object({
    wheelThresholdPx: z.number().positive(),
    quietWindowMs: z.number().nonnegative(),
    swipeMinPx: z.number().positive(),
    swipeMinPxPerMs: z.number().positive(),
  })
  .strict()
/** Thresholds for turning gestures into travel commands. */
export type TravelConfig = z.infer<typeof TravelConfigSchema>

/** Default thresholds: wheel 60 px, quiet window 200 ms, swipe 40 CSS px or 0.3 px/ms. */
export const DEFAULT_TRAVEL_CONFIG: TravelConfig = {
  wheelThresholdPx: 60,
  quietWindowMs: 200,
  swipeMinPx: 40,
  swipeMinPxPerMs: 0.3,
}

import { z } from 'zod'

/** Schema for a level id such as 'l02-bank-account'. */
export const LevelIdSchema = z.string().min(1).brand<'LevelId'>()
/** Branded id of a level. */
export type LevelId = z.infer<typeof LevelIdSchema>

/** Schema for a world location id (a snap point on the street). */
export const LocationIdSchema = z.string().min(1).brand<'LocationId'>()
/** Branded id of a world location. */
export type LocationId = z.infer<typeof LocationIdSchema>

/** Location ids used by the P1 demo. */
export const P1_LOCATION_IDS = ['phone-shop', 'showroom', 'capstone'] as const

/** Schema for a skill-tree node id. */
export const SkillNodeIdSchema = z.string().min(1).brand<'SkillNodeId'>()
/** Branded id of a skill-tree node. */
export type SkillNodeId = z.infer<typeof SkillNodeIdSchema>

/** Schema for an interaction-kit component id (e.g. 'formFiller'). */
export const InteractionIdSchema = z.string().min(1).brand<'InteractionId'>()
/** Branded id of an interaction-kit component. */
export type InteractionId = z.infer<typeof InteractionIdSchema>

/** Schema for a claims-registry source id. */
export const SourceIdSchema = z.string().min(1).brand<'SourceId'>()
/** Branded id of a claims-registry source. */
export type SourceId = z.infer<typeof SourceIdSchema>

/** Schema for a stable dotted error code such as 'upi.pin_to_receive'. */
export const ErrorCategorySchema = z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/)
/** Stable dotted error code; the only learning signal that may leave the device. */
export type ErrorCategory = z.infer<typeof ErrorCategorySchema>

/** Stable error codes used by Levels 4, 5 and 9. */
export const P1_ERROR_CATEGORIES = [
  'upi.pin_to_receive',
  'upi.wrong_payee',
  'fraud.shared_otp',
  'fraud.clicked_link',
  'fraud.urgency',
  'loan.ignored_total_cost',
  'loan.emi_only',
  'loan.missed_payment',
] as const

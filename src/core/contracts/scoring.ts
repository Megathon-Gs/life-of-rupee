import { z } from 'zod'
import { InteractionEventSchema } from './events'
import { ErrorCategorySchema, SkillNodeIdSchema } from './ids'
import { SeveritySchema } from './events'

/** Schema for a level's scoring rubric. */
export const RubricSchema = z
  .object({
    penaltyWeights: z.object({
      minor: z.number().nonnegative(),
      major: z.number().nonnegative(),
      hint1: z.number().nonnegative(),
      hint2: z.number().nonnegative(),
    }),
    /** Highest penalty total that still earns 2 stars (0 penalty is always 3). */
    twoStarMaxPenalty: z.number().nonnegative(),
    /** Star cap when a critical error occurred, even if corrected. */
    criticalCap: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    /** Star cap when the first transfer answer was wrong. */
    transferCap: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    decisionStepId: z.string(),
    transferStepId: z.string(),
  })
  .strict()
/** Penalty weights and caps used to turn one attempt's events into stars. */
export type Rubric = z.infer<typeof RubricSchema>

/** Schema for a score-review card source item. */
export const ReviewItemSchema = z
  .object({
    error: ErrorCategorySchema,
    severity: SeveritySchema,
    skillNode: SkillNodeIdSchema,
    reviewKey: z.string(),
  })
  .strict()
/** One "What changed my result?" card, generated from an error event. */
export type ReviewItem = z.infer<typeof ReviewItemSchema>

/** Schema for the result of scoring one attempt. */
export const ScoreResultSchema = z
  .object({
    stars: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    penalty: z.number().nonnegative(),
    capsApplied: z.array(z.enum(['critical', 'transfer', 'incomplete'])),
    reviewItems: z.array(ReviewItemSchema),
  })
  .strict()
/** Stars, penalty, caps applied and review cards for one attempt. */
export type ScoreResult = z.infer<typeof ScoreResultSchema>

/** Schema for an error category's definition. */
export const ErrorCategoryDefSchema = z
  .object({
    code: ErrorCategorySchema,
    severity: SeveritySchema,
    skillNode: SkillNodeIdSchema,
    reviewKey: z.string(),
  })
  .strict()
/** Maps an error code to its severity, skill node and review-card text key. */
export type ErrorCategoryDef = z.infer<typeof ErrorCategoryDefSchema>

/** Schema for the input handed to a score function. */
export const ScoreInputSchema = z
  .object({
    events: z.array(InteractionEventSchema),
    rubric: RubricSchema,
    errorDefs: z.array(ErrorCategoryDefSchema),
  })
  .strict()
/** Everything a score function needs: one attempt's events, rubric and error defs. */
export type ScoreInput = z.infer<typeof ScoreInputSchema>

/** Pure scoring function: same input always yields the same result. */
export type ScoreFn = (input: ScoreInput) => ScoreResult

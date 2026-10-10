import { z } from 'zod'
import { ErrorCategorySchema } from './ids'

/** Schema for how serious a wrong choice is. */
export const SeveritySchema = z.enum(['minor', 'major', 'critical'])
/** Severity of a wrong choice. */
export type Severity = z.infer<typeof SeveritySchema>

/** Schema for the single event shape every interaction emits. */
export const InteractionEventSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('choice'),
      stepId: z.string(),
      correct: z.boolean(),
      error: ErrorCategorySchema.optional(),
      severity: SeveritySchema.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('hint'),
      stepId: z.string(),
      level: z.union([z.literal(1), z.literal(2)]),
    })
    .strict(),
  z.object({ kind: z.literal('explanationOpened'), stepId: z.string() }).strict(),
])
/** Event emitted by an interaction; scoring and analytics consume only this. */
export type InteractionEvent = z.infer<typeof InteractionEventSchema>

import { z } from 'zod'
import { AttemptRecordSchema, PositionSchema, SettingsSchema } from './save'

/** Anonymous sync code; four letters/numbers after a word prefix. */
export const LearnerCodeSchema = z.string().regex(/^[A-Z]+-[A-Z0-9]{4}$/)
export type LearnerCode = z.infer<typeof LearnerCodeSchema>

export const SyncPushSchema = z
  .object({
    attempts: z.array(AttemptRecordSchema),
    settings: SettingsSchema,
    position: PositionSchema,
  })
  .strict()
export type SyncPush = z.infer<typeof SyncPushSchema>

export const SyncPullSchema = z
  .object({
    attempts: z.array(AttemptRecordSchema),
    settings: SettingsSchema,
    position: PositionSchema,
  })
  .strict()
export type SyncPull = z.infer<typeof SyncPullSchema>

const SuppressedCountSchema = z.union([z.literal('<5'), z.number().int().min(5)])
export const ClassSummarySchema = z
  .object({
    skills: z.array(
      z
        .object({
          skillNode: z.string(),
          learnersAttempted: SuppressedCountSchema,
          medianBestStars: z.union([z.literal('<5'), z.number().min(0).max(3)]),
        })
        .strict(),
    ),
  })
  .strict()
export type ClassSummary = z.infer<typeof ClassSummarySchema>

import { z } from 'zod'
import { InteractionEventSchema } from './events'
import { ErrorCategorySchema, LevelIdSchema, LocationIdSchema, SkillNodeIdSchema } from './ids'

/** Schema for a supported UI locale. */
export const LocaleSchema = z.enum(['en', 'te'])
/** Supported UI locale (English or Telugu). */
export type Locale = z.infer<typeof LocaleSchema>

/** Schema for the star rating of an attempt. */
export const StarsSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)])
/** Star rating from 0 to 3. */
export type Stars = z.infer<typeof StarsSchema>

/** Schema for player settings. */
export const SettingsSchema = z
  .object({
    locale: LocaleSchema,
    reducedMotion: z.union([z.literal('system'), z.boolean()]),
    muted: z.boolean(),
    textScale: z.union([z.literal(1), z.literal(1.25), z.literal(1.5)]),
    updatedAt: z.string(),
    consent: z
      .object({
        status: z.enum(['unknown', 'granted', 'declined']),
        recordedAt: z.string(),
        policyVersion: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict()
/** Player settings; `updatedAt` drives last-writer-wins merging. */
export type Settings = z.infer<typeof SettingsSchema>

/** Optional for old saves; P2-20 migration supplies `{ status: 'unknown' }` when absent. */
export type ConsentState = NonNullable<Settings['consent']>

/** Schema for one append-only attempt record. */
export const AttemptRecordSchema = z
  .object({
    id: z.string(),
    levelId: LevelIdSchema,
    contentVersion: z.string(),
    startedAt: z.string(),
    endedAt: z.string(),
    stars: StarsSchema,
    errors: z.array(ErrorCategorySchema),
    hints: z.number().int().nonnegative(),
    worldChoices: z.record(z.string(), z.string()),
  })
  .strict()
/** One finished attempt at a level; the save's append-only learning log. */
export type AttemptRecord = z.infer<typeof AttemptRecordSchema>

/** Schema for mid-level progress. */
export const InLevelSnapshotSchema = z
  .object({
    levelId: LevelIdSchema,
    stepIndex: z.number().int().nonnegative(),
    events: z.array(InteractionEventSchema),
    seed: z.number().int().optional(),
    startedAt: z.string().optional(),
    /** Step-id decisions fixed at level start and reused on resume, even if world flags change. */
    conditionResults: z.record(z.string().min(1), z.boolean()).optional(),
  })
  .strict()
/** Mid-level progress saved so closing the tab resumes at the same step. */
export type InLevelSnapshot = z.infer<typeof InLevelSnapshotSchema>

/** Schema for the saved player position. */
export const PositionSchema = z
  .object({
    locationId: LocationIdSchema,
    inLevel: InLevelSnapshotSchema.optional(),
  })
  .strict()
/** Where the player stands, and the in-progress level if any. */
export type Position = z.infer<typeof PositionSchema>

/** Schema for the anonymous learner identity. */
export const LearnerSchema = z
  .object({ localId: z.string(), syncCode: z.string().optional() })
  .strict()
/** Anonymous learner identity: a random id, never a name. */
export type Learner = z.infer<typeof LearnerSchema>

/** Schema for the whole save file; strict so personal data cannot creep in. */
export const SaveFileSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    learner: LearnerSchema,
    settings: SettingsSchema,
    position: PositionSchema,
    attempts: z.array(AttemptRecordSchema),
    /** Ids of transitions the player has already watched. */
    seen: z.array(z.string()),
  })
  .strict()
/** The canonical saved state; everything else is derived from it. */
export type SaveFile = z.infer<typeof SaveFileSchema>

/** Schema for values recomputed from a save by `derive`. */
export const DerivedSchema = z
  .object({
    bestStars: z.record(z.string(), StarsSchema),
    firstStars: z.record(z.string(), StarsSchema),
    skills: z.array(SkillNodeIdSchema),
    unlockedLocations: z.array(LocationIdSchema),
    worldFlags: z.record(z.string(), z.string()),
    /** Fictional wallet balance in integer paise. */
    wallet: z.number().int(),
  })
  .strict()
/** Stars, skills, locations, world flags and wallet recomputed from the save. */
export type Derived = z.infer<typeof DerivedSchema>

/** Local teacher view: summed best level stars per branch and a completed-level count. */
export const TeacherSummarySchema = z
  .object({
    starsByBranch: z.array(
      z.object({ labelKey: z.string().min(1), stars: z.number().int().nonnegative() }).strict(),
    ),
    /** Number of distinct levels with at least one star, not number of attempts. */
    levelsCompleted: z.number().int().nonnegative(),
  })
  .strict()
/** Display-only learning totals; no learner, profile, attempt or level identifiers. */
export type TeacherSummary = z.infer<typeof TeacherSummarySchema>

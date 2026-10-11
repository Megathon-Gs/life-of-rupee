import { z } from 'zod'
import {
  InteractionIdSchema,
  LevelIdSchema,
  LocationIdSchema,
  SkillNodeIdSchema,
  SourceIdSchema,
} from './ids'
import { RubricSchema } from './scoring'

/** Schema for a reviewed factual claim tied to sources. */
export const ClaimRefSchema = z
  .object({
    textKey: z.string(),
    sourceIds: z.array(SourceIdSchema).min(1),
    reviewerRole: z.string(),
    reviewedOn: z.string(),
  })
  .strict()
/** A factual statement in a level, with its sources and review stamp. */
export type ClaimRef = z.infer<typeof ClaimRefSchema>

/** Schema for a claims-registry source. */
export const SourceDefSchema = z
  .object({
    id: SourceIdSchema,
    publisher: z.string(),
    title: z.string(),
    url: z.string(),
    retrievedOn: z.string(),
  })
  .strict()
/** A citable source (RBI, NPCI, SEBI, NCFE and so on). */
export type SourceDef = z.infer<typeof SourceDefSchema>

/** Schema for a flag a level sets on completion. */
export const WorldEffectSchema = z.object({ key: z.string(), value: z.string() }).strict()
/** A world choice recorded on completion, e.g. { key: 'vehicle', value: 'bicycle' }. */
export type WorldEffect = z.infer<typeof WorldEffectSchema>

/** Schema for a step condition compared against derived world flags. */
export const StepConditionSchema = z
  .object({ flag: z.string(), equals: z.union([z.string(), z.boolean()]) })
  .strict()
/** A derived world flag and the value required to show a step. */
export type StepCondition = z.infer<typeof StepConditionSchema>

const stepBase = { id: z.string(), when: StepConditionSchema.optional() }

/** Schema for the NPC hook step. */
export const HookStepSchema = z
  .object({ ...stepBase, type: z.literal('hook'), lineKeys: z.array(z.string()).min(1).max(3) })
  .strict()
/** NPC dialogue, at most three lines. */
export type HookStep = z.infer<typeof HookStepSchema>

/** Schema for the interactive micro-lesson step. */
export const LessonStepSchema = z
  .object({
    ...stepBase,
    type: z.literal('lesson'),
    interaction: InteractionIdSchema,
    config: z.unknown(),
  })
  .strict()
/** Interactive micro-lesson run by an interaction component. */
export type LessonStep = z.infer<typeof LessonStepSchema>

/** Schema for the travel step. */
export const TravelStepSchema = z
  .object({ ...stepBase, type: z.literal('travel'), location: LocationIdSchema })
  .strict()
/** Step that sends the player to the level's location. */
export type TravelStep = z.infer<typeof TravelStepSchema>

/** Schema for a config that replaces a step's own when a derived world flag matches. */
export const ConfigOverrideSchema = z
  .object({ when: StepConditionSchema, config: z.unknown() })
  .strict()
/** Alternative decision config, chosen once at level start from derived world flags. */
export type ConfigOverride = z.infer<typeof ConfigOverrideSchema>

/** Schema for the scored decision step. */
export const DecisionStepSchema = z
  .object({
    ...stepBase,
    type: z.literal('decision'),
    interaction: InteractionIdSchema,
    config: z.unknown(),
    /** The first override whose condition holds at level start replaces `config`. */
    configOverrides: z.array(ConfigOverrideSchema).optional(),
    rubric: RubricSchema,
  })
  .strict()
/** The scored decision, with its interaction config and rubric. */
export type DecisionStep = z.infer<typeof DecisionStepSchema>

/** Schema for the consequence step. */
export const ConsequenceStepSchema = z
  .object({
    ...stepBase,
    type: z.literal('consequence'),
    outcomeKeys: z.array(z.string()).min(1),
    explanationKey: z.string(),
  })
  .strict()
/** Visual outcome plus explanation of the decision. */
export type ConsequenceStep = z.infer<typeof ConsequenceStepSchema>

/** Schema for one transfer-step variant. */
export const TransferVariantSchema = z
  .object({ id: z.string(), interaction: InteractionIdSchema, config: z.unknown() })
  .strict()
/** One variant of the transfer step, with new numbers or context. */
export type TransferVariant = z.infer<typeof TransferVariantSchema>

/** Schema for the transfer step. */
export const TransferStepSchema = z
  .object({
    ...stepBase,
    type: z.literal('transfer'),
    variants: z.array(TransferVariantSchema).min(1),
  })
  .strict()
/** Transfer step; one variant is drawn from the pool per attempt. */
export type TransferStep = z.infer<typeof TransferStepSchema>

/** Schema for a level definition. */
export const LevelDefSchema = z
  .object({
    id: LevelIdSchema,
    skillNodes: z.array(SkillNodeIdSchema).min(1),
    location: LocationIdSchema,
    steps: z.tuple([
      HookStepSchema,
      LessonStepSchema,
      TravelStepSchema,
      DecisionStepSchema,
      ConsequenceStepSchema,
      TransferStepSchema,
    ]),
    worldEffects: z.array(WorldEffectSchema),
    claims: z.array(ClaimRefSchema),
  })
  .strict()
/** A level as data: six ordered steps, world effects and claims. */
export type LevelDef = z.infer<typeof LevelDefSchema>

/** Schema for a world location. */
export const LocationDefSchema = z
  .object({
    id: LocationIdSchema,
    x: z.number(),
    district: z.string(),
    doorX: z.number(),
    buildingAsset: z.string(),
    labelKey: z.string(),
    unlockedBy: z.array(LevelIdSchema).readonly().optional(),
  })
  .strict()
/** A snap point on the street with its door and building asset. */
export type LocationDef = z.infer<typeof LocationDefSchema>

/** Schema for the world definition. */
export const WorldDefSchema = z.object({ locations: z.array(LocationDefSchema).min(1) }).strict()
/** The street: an ordered list of locations. */
export type WorldDef = z.infer<typeof WorldDefSchema>

/** Schema for a skill-tree branch. */
export const SkillBranchSchema = z.object({ id: z.string(), labelKey: z.string() }).strict()
/** One of the five skill-tree branches. */
export type SkillBranch = z.infer<typeof SkillBranchSchema>

/** Schema for a skill-tree node. */
export const SkillNodeDefSchema = z
  .object({ id: SkillNodeIdSchema, branch: z.string(), labelKey: z.string() })
  .strict()
/** A skill-tree node belonging to one branch. */
export type SkillNodeDef = z.infer<typeof SkillNodeDefSchema>

/** Schema for a skill-tree edge. */
export const SkillEdgeSchema = z.object({ from: SkillNodeIdSchema, to: SkillNodeIdSchema }).strict()
/** A prerequisite edge between two skill nodes. */
export type SkillEdge = z.infer<typeof SkillEdgeSchema>

/** Schema for the skill tree. */
export const SkillTreeDefSchema = z
  .object({
    branches: z.array(SkillBranchSchema).length(5),
    nodes: z.array(SkillNodeDefSchema),
    edges: z.array(SkillEdgeSchema),
  })
  .strict()
/** The skill tree: five branches, nodes and prerequisite edges. */
export type SkillTreeDef = z.infer<typeof SkillTreeDefSchema>

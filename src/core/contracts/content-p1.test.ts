import { describe, expect, it } from 'vitest'
import {
  ConsequenceStepSchema,
  DecisionStepSchema,
  HookStepSchema,
  LessonStepSchema,
  LevelDefSchema,
  LocationDefSchema,
  StepConditionSchema,
  TransferStepSchema,
  TravelStepSchema,
} from './content'
import { LevelIdSchema, type LevelId } from './ids'
import type { StateLocationDef } from '../state/derive'

const stepFixtures = [
  { schema: HookStepSchema, step: { id: 'hook', type: 'hook', lineKeys: ['hook.line'] } },
  {
    schema: LessonStepSchema,
    step: { id: 'lesson', type: 'lesson', interaction: 'messageTriage', config: {} },
  },
  { schema: TravelStepSchema, step: { id: 'travel', type: 'travel', location: 'phone-shop' } },
  {
    schema: DecisionStepSchema,
    step: {
      id: 'decision',
      type: 'decision',
      interaction: 'messageTriage',
      config: {},
      rubric: {
        penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
        twoStarMaxPenalty: 2,
        criticalCap: 1,
        transferCap: 2,
        decisionStepId: 'decision',
        transferStepId: 'transfer',
      },
    },
  },
  {
    schema: ConsequenceStepSchema,
    step: {
      id: 'consequence',
      type: 'consequence',
      outcomeKeys: ['outcome'],
      explanationKey: 'explanation',
    },
  },
  {
    schema: TransferStepSchema,
    step: {
      id: 'transfer',
      type: 'transfer',
      variants: [{ id: 'v1', interaction: 'messageTriage', config: {} }],
    },
  },
]

const location = {
  id: 'phone-shop',
  x: 320,
  district: 'urban',
  doorX: 344,
  buildingAsset: 'phone-shop',
  labelKey: 'loc.phone-shop',
}

describe('P1 content contracts', () => {
  it.each(stepFixtures)('accepts optional conditions on $step.type steps', ({ schema, step }) => {
    expect(schema.safeParse(step).success).toBe(true)
    for (const equals of ['true', true, false]) {
      const when = { flag: 'fraud.seenWarningSigns', equals }
      expect(schema.parse({ ...step, when }).when).toEqual(when)
    }
    expect(
      schema.safeParse({ ...step, when: { flag: 'fraud.seenWarningSigns', equals: 1 } }).success,
    ).toBe(false)
    expect(schema.safeParse({ ...step, extra: true }).success).toBe(false)
  })

  it.each([
    {},
    { flag: 'fraud.seenWarningSigns' },
    { equals: true },
    { flag: 1, equals: true },
    { flag: 'fraud.seenWarningSigns', equals: 1 },
    { flag: 'fraud.seenWarningSigns', equals: null },
    { flag: 'fraud.seenWarningSigns', equals: true, extra: true },
  ])('rejects an invalid condition: %j', (when) => {
    expect(StepConditionSchema.safeParse(when).success).toBe(false)
    expect(HookStepSchema.safeParse({ ...stepFixtures[0]!.step, when }).success).toBe(false)
  })

  it('parses a full level with conditions on all six steps', () => {
    const level = {
      id: 'l05-fraud',
      skillNodes: ['safety.fraud'],
      location: 'phone-shop',
      steps: stepFixtures.map(({ step }) => ({
        ...step,
        when: { flag: 'fraud.seenWarningSigns', equals: 'true' },
      })),
      worldEffects: [],
      claims: [],
    }
    expect(LevelDefSchema.parse(level)).toEqual(level)
  })

  it('accepts locations with absent, empty or valid unlock prerequisites', () => {
    expect(LocationDefSchema.parse(location)).toEqual(location)
    for (const unlockedBy of [[], ['l02-bank-account'], ['l04-upi', 'l05-fraud']]) {
      expect(LocationDefSchema.parse({ ...location, unlockedBy }).unlockedBy).toEqual(unlockedBy)
    }
  })

  it('preserves readonly unlock prerequisites accepted by P0 derive', () => {
    const unlockedBy: readonly LevelId[] = [LevelIdSchema.parse('l02-bank-account')]
    const gated: StateLocationDef = { ...LocationDefSchema.parse(location), unlockedBy }
    expect(LocationDefSchema.parse(gated).unlockedBy).toEqual(unlockedBy)
  })

  it.each(['l02-bank-account', [''], [1], [null], null])(
    'rejects invalid unlock prerequisites: %j',
    (unlockedBy) => {
      expect(LocationDefSchema.safeParse({ ...location, unlockedBy }).success).toBe(false)
    },
  )

  it('rejects unknown location keys', () => {
    expect(LocationDefSchema.safeParse({ ...location, unlockedBy: [], extra: true }).success).toBe(
      false,
    )
  })
})

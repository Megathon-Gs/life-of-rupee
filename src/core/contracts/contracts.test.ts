import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TRAVEL_CONFIG,
  DocumentInspectorConfigSchema,
  FormFillerConfigSchema,
  LevelDefSchema,
  SaveFileSchema,
  SkillTreeDefSchema,
  WorldDefSchema,
} from './index'

const rubric = {
  penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
  twoStarMaxPenalty: 2,
  criticalCap: 1,
  transferCap: 2,
  decisionStepId: 'l02-decision',
  transferStepId: 'l02-transfer',
}

const level = {
  id: 'l02-bank-account',
  skillNodes: ['bank.account'],
  location: 'bank',
  steps: [
    { id: 'l02-hook', type: 'hook', lineKeys: ['l02.hook.1'] },
    { id: 'l02-lesson', type: 'lesson', interaction: 'documentInspector', config: {} },
    { id: 'l02-travel', type: 'travel', location: 'bank' },
    { id: 'l02-decision', type: 'decision', interaction: 'formFiller', config: {}, rubric },
    {
      id: 'l02-consequence',
      type: 'consequence',
      outcomeKeys: ['l02.out.1'],
      explanationKey: 'l02.why',
    },
    {
      id: 'l02-transfer',
      type: 'transfer',
      variants: [{ id: 'v1', interaction: 'formFiller', config: {} }],
    },
  ],
  worldEffects: [{ key: 'bankTeller', value: 'greets' }],
  claims: [
    {
      textKey: 'l02.claim.1',
      sourceIds: ['rbi-kyc'],
      reviewerRole: 'educator',
      reviewedOn: '2026-01-01',
    },
  ],
}

const world = {
  locations: [
    {
      id: 'bank',
      x: 320,
      district: 'urban',
      doorX: 344,
      buildingAsset: 'bank',
      labelKey: 'loc.bank',
    },
  ],
}

const skillTree = {
  branches: ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, labelKey: `branch.${id}` })),
  nodes: [
    { id: 'bank.account', branch: 'a', labelKey: 'node.bank' },
    { id: 'bank.upi', branch: 'a', labelKey: 'node.upi' },
  ],
  edges: [{ from: 'bank.account', to: 'bank.upi' }],
}

const save = {
  schemaVersion: 1,
  learner: { localId: '3f2a9c1e-0000-4000-8000-000000000000' },
  settings: {
    locale: 'en',
    reducedMotion: 'system',
    muted: false,
    textScale: 1,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  position: { locationId: 'home' },
  attempts: [
    {
      id: 'a1',
      levelId: 'l02-bank-account',
      contentVersion: 'abc',
      startedAt: '2026-01-01T00:00:00Z',
      endedAt: '2026-01-01T00:05:00Z',
      stars: 2,
      errors: ['upi.pin_to_receive'],
      hints: 1,
      worldChoices: {},
    },
  ],
  seen: ['arrive-bank'],
}

describe('contract fixtures', () => {
  it('parses a LevelDef', () => expect(LevelDefSchema.safeParse(level).success).toBe(true))
  it('parses a WorldDef', () => expect(WorldDefSchema.safeParse(world).success).toBe(true))
  it('parses a SkillTreeDef', () =>
    expect(SkillTreeDefSchema.safeParse(skillTree).success).toBe(true))
  it('parses a SaveFile', () => expect(SaveFileSchema.safeParse(save).success).toBe(true))

  it('rejects a SaveFile with an extra top-level key', () => {
    expect(SaveFileSchema.safeParse({ ...save, name: 'Asha' }).success).toBe(false)
  })
  it('rejects extra keys in nested save objects', () => {
    expect(
      SaveFileSchema.safeParse({ ...save, learner: { ...save.learner, name: 'Asha' } }).success,
    ).toBe(false)
    expect(
      SaveFileSchema.safeParse({ ...save, settings: { ...save.settings, x: 1 } }).success,
    ).toBe(false)
  })
  it('rejects extra keys in saved in-level events', () => {
    const inLevel = {
      levelId: 'l02-bank-account',
      stepIndex: 1,
      events: [{ kind: 'hint', stepId: 'l02-lesson', level: 1, name: 'Asha' }],
    }
    expect(
      SaveFileSchema.safeParse({ ...save, position: { ...save.position, inLevel } }).success,
    ).toBe(false)
  })
  it('accepts old and seeded in-level snapshots', () => {
    const inLevel = {
      levelId: 'l02-bank-account',
      stepIndex: 1,
      events: [{ kind: 'hint', stepId: 'l02-lesson', level: 1 }],
    }
    expect(
      SaveFileSchema.safeParse({ ...save, position: { ...save.position, inLevel } }).success,
    ).toBe(true)
    expect(
      SaveFileSchema.safeParse({
        ...save,
        position: {
          ...save.position,
          inLevel: { ...inLevel, seed: 42, startedAt: '2026-01-01T00:00:00Z' },
        },
      }).success,
    ).toBe(true)
  })
  it('rejects non-dotted error codes in interaction configs', () => {
    const formFiller = {
      titleKey: 't',
      fields: [
        {
          id: 'f',
          labelKey: 'l',
          options: [{ id: 'a', labelKey: 'a' }],
          correctOptionId: 'a',
          error: 'nodots',
        },
      ],
    }
    const inspector = {
      titleKey: 't',
      promptKey: 'p',
      fields: [{ id: 'f', labelKey: 'l', valueKey: 'v', isAnswer: true, error: 'nodots' }],
    }
    expect(FormFillerConfigSchema.safeParse(formFiller).success).toBe(false)
    expect(DocumentInspectorConfigSchema.safeParse(inspector).success).toBe(false)
    formFiller.fields[0]!.error = 'kyc.wrong_document'
    expect(FormFillerConfigSchema.safeParse(formFiller).success).toBe(true)
  })
  it('rejects a skill tree without five branches', () => {
    expect(
      SkillTreeDefSchema.safeParse({ ...skillTree, branches: skillTree.branches.slice(0, 4) })
        .success,
    ).toBe(false)
  })
  it('rejects a non-dotted error category', () => {
    const bad = { ...save, attempts: [{ ...save.attempts[0], errors: ['nodots'] }] }
    expect(SaveFileSchema.safeParse(bad).success).toBe(false)
  })
  it('exposes the default travel thresholds', () => {
    expect(DEFAULT_TRAVEL_CONFIG).toEqual({
      wheelThresholdPx: 60,
      quietWindowMs: 200,
      swipeMinPx: 40,
      swipeMinPxPerMs: 0.3,
    })
  })
})

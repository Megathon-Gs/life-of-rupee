import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  ScoreResultSchema,
  ErrorCategoryDefSchema,
  type InteractionEvent,
  type ScoreFn,
} from '../contracts'
import { defaultRubric, score } from './rubric'
import { reviewItems } from './review'

type Choice = Extract<InteractionEvent, { kind: 'choice' }>
const correct = (stepId = 'decision'): Choice => ({
  kind: 'choice',
  stepId,
  correct: true,
})
const wrong = (severity: 'minor' | 'major' | 'critical', stepId = 'decision'): Choice => ({
  kind: 'choice',
  stepId,
  correct: false,
  severity,
})
const minor: Choice = {
  ...wrong('minor'),
  error: 'bank.wrong_document',
}
const major: Choice = {
  ...wrong('major'),
  error: 'loan.ignored_total_cost',
}
const critical: Choice = {
  ...wrong('critical'),
  error: 'fraud.shared_otp',
}

describe('score', () => {
  it.each<[string, InteractionEvent[], number, number]>([
    ['correct only', [correct()], 3, 0],
    ['one minor', [minor, correct()], 2, 1],
    ['minor and major', [minor, major, correct()], 1, 3],
    ['level 1 hint', [{ kind: 'hint', stepId: 'decision', level: 1 }, correct()], 2, 0.5],
    ['level 2 hint', [{ kind: 'hint', stepId: 'decision', level: 2 }, correct()], 2, 1],
    ['two-point boundary', [major, correct()], 2, 2],
    ['above boundary', [major, { kind: 'hint', stepId: 'decision', level: 1 }, correct()], 1, 2.5],
    [
      'free explanations',
      [
        ...Array.from({ length: 5 }, (): InteractionEvent => ({
          kind: 'explanationOpened',
          stepId: 'decision',
        })),
        correct(),
      ],
      3,
      0,
    ],
    ['unresolved critical', [critical], 0, 0],
    ['corrected critical', [critical, correct()], 1, 0],
    ['transfer correction', [correct(), wrong('minor', 'transfer'), correct('transfer')], 2, 1],
    ['no correct decision', [minor], 0, 1],
    ['empty attempt', [], 0, 0],
    ['wrong step', [correct('other')], 0, 0],
    ['prior success cannot resolve critical', [correct(), critical], 0, 0],
    ['other step cannot resolve critical', [critical, correct('other'), correct('transfer')], 0, 0],
    ['every critical must be resolved', [critical, correct(), wrong('critical', 'other')], 0, 0],
    [
      'correction on another critical step',
      [wrong('critical', 'other'), correct('other'), correct()],
      1,
      0,
    ],
    [
      'first transfer answer correct',
      [correct(), correct('transfer'), wrong('minor', 'transfer')],
      2,
      1,
    ],
    ['correct choices do not incur errors', [{ ...minor, correct: true }, correct()], 3, 0],
  ])('%s', (_name, events, stars, penalty) => {
    const result = score(events, defaultRubric)
    expect(result.stars).toBe(stars)
    expect(result.penalty).toBe(penalty)
    expect(ScoreResultSchema.safeParse(result).success).toBe(true)
  })

  it('applies configured weights, step ids, thresholds and caps', () => {
    const rubric = {
      ...defaultRubric,
      decisionStepId: 'd',
      transferStepId: 't',
      penaltyWeights: { minor: 0, major: 4, hint1: 2, hint2: 3 },
      twoStarMaxPenalty: 4,
      transferCap: 1 as const,
      criticalCap: 0 as const,
    }
    expect(score([wrong('major', 'd'), correct('d')], rubric).stars).toBe(2)
    expect(score([{ kind: 'hint', stepId: 'd', level: 2 }, correct('d')], rubric).penalty).toBe(3)
    expect(score([correct('d'), wrong('minor', 't'), correct('t')], rubric)).toMatchObject({
      stars: 1,
      penalty: 0,
      capsApplied: ['transfer'],
    })
    expect(score([wrong('critical', 'd'), correct('d')], rubric)).toMatchObject({
      stars: 0,
      capsApplied: ['critical'],
    })
  })

  it('records all applicable caps and includes review cards', () => {
    expect(score([critical, wrong('minor', 'transfer')], defaultRubric)).toMatchObject({
      stars: 0,
      capsApplied: ['incomplete', 'transfer', 'critical'],
      reviewItems: [{ error: 'fraud.shared_otp', severity: 'critical' }],
    })
    expect(score([correct()], defaultRubric).capsApplied).toEqual([])
  })

  it('caps only a wrong first transfer choice, ignoring earlier hints', () => {
    const rubric = { ...defaultRubric, penaltyWeights: { minor: 0, major: 0, hint1: 0, hint2: 0 } }
    const hint: InteractionEvent = { kind: 'hint', stepId: 'transfer', level: 1 }
    expect(
      score([correct(), hint, wrong('minor', 'transfer'), correct('transfer')], rubric),
    ).toMatchObject({ stars: 2, capsApplied: ['transfer'] })
    expect(
      score([correct(), hint, correct('transfer'), wrong('minor', 'transfer')], rubric),
    ).toMatchObject({ stars: 3, capsApplied: [] })
  })

  it('uses registry severity when a wrong choice omits it', () => {
    expect(
      score(
        [
          { kind: 'choice', stepId: 'decision', correct: false, error: 'upi.pin_to_receive' },
          correct(),
        ],
        defaultRubric,
      ).stars,
    ).toBe(1)
    expect(
      score(
        [
          { kind: 'choice', stepId: 'decision', correct: false, error: 'kyc.wrong_document' },
          correct(),
        ],
        defaultRubric,
      ).penalty,
    ).toBe(2)
  })

  it('rejects a mistake without severity or a category', () => {
    expect(() =>
      score([{ kind: 'choice', stepId: 'decision', correct: false }, correct()], defaultRubric),
    ).toThrow('Missing severity for wrong choice on step: decision')
  })

  it('supports the frozen ScoreFn contract and supplied category definitions', () => {
    const scoreFn: ScoreFn = score
    const errorDefs = [
      ErrorCategoryDefSchema.parse({
        code: 'bank.custom_error',
        severity: 'major',
        skillNode: 'bank.account',
        reviewKey: 'custom.review',
      }),
    ]
    expect(
      scoreFn({
        events: [
          { kind: 'choice', stepId: 'decision', correct: false, error: 'bank.custom_error' },
          correct(),
        ],
        rubric: defaultRubric,
        errorDefs,
      }),
    ).toEqual({
      stars: 2,
      penalty: 2,
      capsApplied: [],
      reviewItems: [
        {
          error: 'bank.custom_error',
          severity: 'major',
          skillNode: 'bank.account',
          reviewKey: 'custom.review',
        },
      ],
    })
  })

  it('is deterministic, ignores timestamps and leaves inputs unchanged', () => {
    const event = fc.oneof(
      fc.record({
        kind: fc.constant('choice' as const),
        stepId: fc.constantFrom('decision', 'transfer', 'other'),
        correct: fc.boolean(),
        severity: fc.constantFrom('minor' as const, 'major' as const, 'critical' as const),
      }),
      fc.record({
        kind: fc.constant('hint' as const),
        stepId: fc.constantFrom('decision', 'transfer'),
        level: fc.constantFrom(1 as const, 2 as const),
      }),
      fc.record({
        kind: fc.constant('explanationOpened' as const),
        stepId: fc.constant('decision'),
      }),
    )
    fc.assert(
      fc.property(fc.array(event), fc.array(fc.integer()), (events, times) => {
        const before = events.map((event) => ({ ...event }))
        const result = score(events, defaultRubric)
        expect(score(events, defaultRubric)).toEqual(result)
        expect(
          score(
            events.map((e, i) => ({ ...e, timestamp: times[i] ?? 0 })),
            defaultRubric,
          ),
        ).toEqual(result)
        expect(events).toEqual(before)
      }),
    )
  })
})

describe('reviewItems', () => {
  it('deduplicates errors and sorts critical, major, minor', () => {
    expect(
      reviewItems([minor, major, minor, critical]).map((item) => [item.error, item.severity]),
    ).toEqual([
      ['fraud.shared_otp', 'critical'],
      ['loan.ignored_total_cost', 'major'],
      ['bank.wrong_document', 'minor'],
    ])
  })

  it('maps known categories to skill nodes and review keys', () => {
    expect(reviewItems([critical])).toEqual([
      {
        error: 'fraud.shared_otp',
        severity: 'critical',
        skillNode: 'safety.fraud',
        reviewKey: 'fraud.shared_otp.review',
      },
    ])
  })

  it('keeps the highest severity when the same category repeats', () => {
    expect(reviewItems([{ ...critical, severity: 'minor' }, critical])).toMatchObject([
      { error: 'fraud.shared_otp', severity: 'critical' },
    ])
  })

  it('ignores correct choices, hints and uncategorized mistakes', () => {
    expect(
      reviewItems([
        { ...minor, correct: true },
        wrong('major'),
        { kind: 'hint', stepId: 'decision', level: 1 },
      ]),
    ).toEqual([])
  })

  it('rejects an unknown category instead of silently losing its review', () => {
    const events: InteractionEvent[] = [
      { kind: 'choice', stepId: 'decision', correct: false, error: 'unknown.error' },
      correct(),
    ]
    expect(() => reviewItems(events)).toThrow('Unknown error category: unknown.error')
    expect(() => score(events, defaultRubric)).toThrow('Unknown error category: unknown.error')
  })
})

import { describe, expect, it } from 'vitest'
import { AppConfigSchema, TeacherSummarySchema, type TeacherSummary } from './index'

const summary: TeacherSummary = {
  starsByBranch: [
    { labelKey: 'branch.financial-access', stars: 6 },
    { labelKey: 'branch.financial-safety', stars: 0 },
  ],
  levelsCompleted: 2,
}

describe('P1 app contracts', () => {
  it.each([true, false])('accepts an explicit capstone switch: %s', (capstone) => {
    const config = { features: { capstone } }
    expect(AppConfigSchema.parse(config)).toEqual(config)
  })

  it.each([{}, { features: {} }, { features: { capstone: 'true' } }])(
    'rejects a missing or non-boolean capstone switch: %j',
    (config) => expect(AppConfigSchema.safeParse(config).success).toBe(false),
  )

  it('keeps app config strict', () => {
    expect(AppConfigSchema.safeParse({ features: { capstone: false, extra: true } }).success).toBe(
      false,
    )
    expect(AppConfigSchema.safeParse({ features: { capstone: false }, extra: true }).success).toBe(
      false,
    )
  })

  it('parses aggregate stars and completion totals without IDs', () => {
    expect(TeacherSummarySchema.parse(summary)).toEqual(summary)
    expect(TeacherSummarySchema.parse({ starsByBranch: [], levelsCompleted: 0 })).toEqual({
      starsByBranch: [],
      levelsCompleted: 0,
    })
  })

  it.each([-1, 0.5, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid learning totals: %s',
    (value) => {
      expect(TeacherSummarySchema.safeParse({ ...summary, levelsCompleted: value }).success).toBe(
        false,
      )
      expect(
        TeacherSummarySchema.safeParse({
          ...summary,
          starsByBranch: [{ labelKey: 'branch.borrowing', stars: value }],
        }).success,
      ).toBe(false)
    },
  )

  it.each(['localId', 'syncCode', 'name', 'profileId', 'attemptId', 'levelId', 'timestamp'])(
    'rejects identity and metadata fields: %s',
    (key) => {
      expect(TeacherSummarySchema.safeParse({ ...summary, [key]: 'private' }).success).toBe(false)
      expect(
        TeacherSummarySchema.safeParse({
          ...summary,
          starsByBranch: [{ ...summary.starsByBranch[0], [key]: 'private' }],
        }).success,
      ).toBe(false)
    },
  )
})

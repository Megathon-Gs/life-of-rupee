import { describe, expect, it } from 'vitest'
import type { AttemptRecord, Derived } from '@/core/contracts'
import { levels } from '@/content/levels'
import { skillTree } from '@/content/skillTree'
import { buildTeacherSummary, topErrors } from './teacher'

const derived = (patch: Partial<Derived>): Derived => ({
  bestStars: {},
  firstStars: {},
  skills: [],
  unlockedLocations: [],
  worldFlags: {},
  wallet: 0,
  ...patch,
})

describe('buildTeacherSummary', () => {
  it('sums best stars into the branch of each passed level', () => {
    const summary = buildTeacherSummary(
      derived({ bestStars: { 'l05-fraud-safety': 3, 'l09-loans-emi': 2 } }),
      levels,
      skillTree,
    )
    expect(summary.levelsCompleted).toBe(2)
    const byBranch = Object.fromEntries(summary.starsByBranch.map((b) => [b.labelKey, b.stars]))
    expect(byBranch['branch.financial-safety']).toBe(3)
    expect(byBranch['branch.borrowing']).toBe(2)
    expect(summary.starsByBranch).toHaveLength(5)
  })

  it('counts only levels with at least one star as completed', () => {
    const summary = buildTeacherSummary(derived({ bestStars: { 'l05-fraud-safety': 0 } }), levels, skillTree)
    expect(summary.levelsCompleted).toBe(0)
  })
})

describe('topErrors', () => {
  it('ranks the most frequent error codes first', () => {
    const attempt = (errors: string[]) => ({ errors }) as unknown as AttemptRecord
    expect(
      topErrors([attempt(['upi.wrong_payee', 'loan.emi_only']), attempt(['upi.wrong_payee'])]),
    ).toEqual([
      { code: 'upi.wrong_payee', count: 2 },
      { code: 'loan.emi_only', count: 1 },
    ])
  })
})
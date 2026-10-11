import { expect, it } from 'vitest'
import { score, errorCategories, defaultRubric } from './index'

it('investment mistakes score and resolve to investment review cards', () => {
  for (const code of [
    'investing.guaranteed_return',
    'investing.ignored_horizon',
    'investing.concentrated_risk',
  ]) {
    const definition = errorCategories[code]!
    const result = score(
      [
        { kind: 'choice', stepId: 'decision', correct: false, error: definition.code },
        { kind: 'choice', stepId: 'decision', correct: true },
      ],
      defaultRubric,
    )
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toEqual([
      {
        error: definition.code,
        severity: 'major',
        skillNode: 'growth.investing',
        reviewKey: `${code}.review`,
      },
    ])
  }
})

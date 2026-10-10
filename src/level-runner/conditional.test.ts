import { describe, expect, it } from 'vitest'
import { InLevelSnapshotSchema, type LevelDef, type LevelCompletion } from '@/core/contracts'
import { fixtureLevel } from './__fixtures__/level'
import { createLevelRunner } from './runner'

const now = () => '2026-10-10T00:00:00Z'
const conditional: LevelDef = {
  ...fixtureLevel,
  steps: [
    { ...fixtureLevel.steps[0], when: { flag: 'fraud.seenWarningSigns', equals: 'true' } },
    fixtureLevel.steps[1],
    fixtureLevel.steps[2],
    fixtureLevel.steps[3],
    fixtureLevel.steps[4],
    { ...fixtureLevel.steps[5], when: { flag: 'loan.activeInstallment', equals: 'true' } },
  ],
}

const runnerFor = () =>
  createLevelRunner({ levels: [conditional], newId: () => 'conditional-attempt', now })

describe('conditional level steps', () => {
  it('shows matching steps and skips nonmatching steps without accepting their events', () => {
    const shown = runnerFor()
    shown.start(conditional, 7, now, {
      'fraud.seenWarningSigns': 'true',
      'loan.activeInstallment': 'true',
    })
    expect(shown.current().view?.stepId).toBe('hook')
    expect(shown.snapshot().conditionResults).toEqual({ hook: true, transfer: true })

    const skipped = runnerFor()
    const completions: LevelCompletion[] = []
    skipped.onComplete((completion) => completions.push(completion))
    skipped.start(conditional, 7, now)
    expect(skipped.current().view?.stepId).toBe('lesson')
    expect(skipped.snapshot().conditionResults).toEqual({ hook: false, transfer: false })
    expect(skipped.advance()).toBe(false)
    expect(skipped.dispatch({ kind: 'choice', stepId: 'hook', correct: true })).toBe(false)
    skipped.complete()
    skipped.arrive(conditional.location)
    skipped.dispatch({ kind: 'choice', stepId: 'decision', correct: true })
    skipped.complete()
    skipped.advance()
    expect(skipped.current()).toMatchObject({ done: true, view: null, stepIndex: 5 })
    expect(skipped.current().events).toEqual([
      { kind: 'choice', stepId: 'decision', correct: true },
    ])
    expect(completions).toHaveLength(1)
    expect(completions[0]!.attempt.stars).toBe(3)
  })

  it('keeps start-time decisions after resume even if the world flags change', () => {
    const started = runnerFor()
    started.start(conditional, 7, now, { 'fraud.seenWarningSigns': 'true' })
    started.advance()
    const snapshot = InLevelSnapshotSchema.parse(started.snapshot())

    const resumed = runnerFor()
    resumed.resume(snapshot, {
      worldFlags: { 'fraud.seenWarningSigns': 'false', 'loan.activeInstallment': 'true' },
    })
    expect(resumed.snapshot().conditionResults).toEqual({ hook: true, transfer: false })
    resumed.complete()
    resumed.arrive(conditional.location)
    resumed.complete()
    resumed.advance()
    expect(resumed.current().done).toBe(true)

    const skipped = runnerFor()
    skipped.start(conditional, 7, now)
    const skippedSnapshot = InLevelSnapshotSchema.parse(skipped.snapshot())
    const newlyTrue = runnerFor()
    newlyTrue.resume(skippedSnapshot, { worldFlags: { 'fraud.seenWarningSigns': 'true' } })
    expect(newlyTrue.current().view?.stepId).toBe('lesson')
    expect(newlyTrue.snapshot().conditionResults).toEqual({ hook: false, transfer: false })
  })

  it('uses fresh flags for a later start on the same runner', () => {
    const runner = runnerFor()
    runner.start(conditional, 7, now)
    expect(runner.current().view?.stepId).toBe('lesson')
    runner.start(conditional, 7, now, { 'fraud.seenWarningSigns': 'true' })
    expect(runner.current().view?.stepId).toBe('hook')
  })

  it('completes after a skipped decision with the existing zero-star scoring rule', () => {
    const level: LevelDef = {
      ...fixtureLevel,
      steps: [
        fixtureLevel.steps[0],
        fixtureLevel.steps[1],
        fixtureLevel.steps[2],
        { ...fixtureLevel.steps[3], when: { flag: 'decision.enabled', equals: true } },
        fixtureLevel.steps[4],
        fixtureLevel.steps[5],
      ],
    }
    const runner = createLevelRunner({ levels: [level], newId: () => 'skipped-decision' })
    const completions: LevelCompletion[] = []
    runner.onComplete((completion) => completions.push(completion))
    runner.start(level, 7, now)
    runner.advance()
    runner.complete()
    runner.arrive(level.location)
    expect(runner.current().view?.stepId).toBe('consequence')
    expect(runner.dispatch({ kind: 'choice', stepId: 'decision', correct: true })).toBe(false)
    runner.advance()
    runner.complete()
    expect(runner.current().done).toBe(true)
    expect(completions).toHaveLength(1)
    expect(completions[0]!.attempt.stars).toBe(0)
  })
})

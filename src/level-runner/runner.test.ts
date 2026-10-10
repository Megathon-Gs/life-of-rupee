import { describe, expect, it } from 'vitest'
import {
  AttemptRecordSchema,
  InLevelSnapshotSchema,
  type InteractionEvent,
  type LevelCompletion,
  type LocationId,
} from '@/core/contracts'
import { score } from '@/core/scoring'
import { fixtureLevel } from './__fixtures__/level'
import { contentVersion } from './contentVersion'
import { createLevelRunner, type LevelRunnerImpl } from './runner'

const loc = (id: string) => id as LocationId

const clock = () => {
  let t = 0
  return () => new Date(Date.UTC(2026, 0, 1, 0, 0, t++)).toISOString()
}

const setup = (seed = 7) => {
  const runner = createLevelRunner({ levels: [fixtureLevel], newId: () => 'attempt-1' })
  const completions: LevelCompletion[] = []
  runner.onComplete((c) => completions.push(c))
  runner.start(fixtureLevel, seed, clock())
  return { runner, completions }
}

// Walks Hook → Lesson → Travel and stops on the Decision step.
const toDecision = (runner: LevelRunnerImpl) => {
  runner.advance()
  runner.dispatch({ kind: 'choice', stepId: 'lesson', correct: true })
  runner.complete()
  runner.arrive(loc('bank'))
}

const minorMistakeRun = (runner: LevelRunnerImpl) => {
  toDecision(runner)
  runner.dispatch({
    kind: 'choice',
    stepId: 'decision',
    correct: false,
    error: 'bank.wrong_document',
    severity: 'minor',
  })
  runner.dispatch({ kind: 'choice', stepId: 'decision', correct: true })
  runner.complete()
  runner.advance()
  runner.dispatch({ kind: 'choice', stepId: 'transfer', correct: true })
  runner.complete()
}

describe('LevelRunner', () => {
  it('records both fields of a form, including a corrected mistake, before completion', () => {
    const { runner, completions } = setup()
    toDecision(runner)
    expect(runner.current().view).toMatchObject({
      interaction: 'formFiller',
      config: { fields: [{ id: 'route' }, { id: 'identity' }] },
    })
    const choices: InteractionEvent[] = [
      { kind: 'choice', stepId: 'decision', correct: true },
      {
        kind: 'choice',
        stepId: 'decision',
        correct: false,
        error: 'bank.wrong_document',
        severity: 'minor',
      },
      { kind: 'choice', stepId: 'decision', correct: true },
    ]
    for (const choice of choices) {
      expect(runner.dispatch(choice)).toBe(true)
      expect(runner.current().view?.type).toBe('decision')
    }
    expect(runner.current().events.filter((event) => event.stepId === 'decision')).toEqual(choices)
    expect(runner.dispatch({ kind: 'interactionDone' })).toBe(true)
    expect(runner.current().view?.type).toBe('consequence')
    runner.advance()
    runner.dispatch({ kind: 'choice', stepId: 'transfer', correct: true })
    runner.complete()
    expect(completions[0]!.score.stars).toBe(2)
    expect(completions[0]!.attempt.errors).toEqual(['bank.wrong_document'])
  })

  it('walks the six steps in order and exposes what to render', () => {
    const { runner } = setup()
    expect(runner.current().view).toEqual({
      type: 'hook',
      stepId: 'hook',
      lineKeys: ['fixture.hook.1', 'fixture.hook.2'],
    })
    runner.advance()
    expect(runner.current().view).toMatchObject({
      type: 'lesson',
      interaction: 'documentInspector',
      config: { fields: 2 },
    })
    runner.dispatch({ kind: 'choice', stepId: 'lesson', correct: true })
    expect(runner.current().view?.type).toBe('lesson')
    runner.complete()
    expect(runner.current().view).toEqual({ type: 'travel', stepId: 'travel', location: 'bank' })
    runner.arrive(loc('bank'))
    expect(runner.current().view).toMatchObject({ type: 'decision', interaction: 'formFiller' })
    runner.dispatch({ kind: 'choice', stepId: 'decision', correct: true })
    expect(runner.current().view?.type).toBe('decision')
    runner.dispatch({ kind: 'interactionDone' })
    expect(runner.current().view).toMatchObject({
      type: 'consequence',
      explanationKey: 'fixture.explain',
    })
    runner.advance()
    expect(runner.current().view).toMatchObject({ type: 'transfer', stepId: 'transfer' })
    runner.dispatch({ kind: 'choice', stepId: 'transfer', correct: true })
    expect(runner.current().done).toBe(false)
    runner.complete()
    expect(runner.current()).toMatchObject({ done: true, view: null })
  })

  it('one minor mistake: AttemptRecord stars equal score() on the same events (2)', () => {
    const { runner, completions } = setup()
    minorMistakeRun(runner)
    expect(completions).toHaveLength(1)
    const { attempt, score: result } = completions[0]!
    const events = runner.current().events
    expect(attempt.stars).toBe(score(events, fixtureLevel.steps[3].rubric).stars)
    expect(attempt.stars).toBe(2)
    expect(result.stars).toBe(2)
    expect(AttemptRecordSchema.parse(attempt)).toEqual({
      id: 'attempt-1',
      levelId: 'l99-fixture',
      contentVersion: contentVersion(fixtureLevel),
      startedAt: '2026-01-01T00:00:00.000Z',
      endedAt: '2026-01-01T00:00:01.000Z',
      stars: 2,
      errors: ['bank.wrong_document'],
      hints: 0,
      worldChoices: { bankAccount: 'opened' },
    })
  })

  it('snapshot mid-Decision → resume continues at the same step with the same events', () => {
    const { runner } = setup()
    toDecision(runner)
    runner.dispatch({ kind: 'hint', stepId: 'decision', level: 1 })
    const snapshot = InLevelSnapshotSchema.parse(runner.snapshot())

    const resumed = createLevelRunner({ levels: [fixtureLevel], newId: () => 'attempt-2' })
    const completions: LevelCompletion[] = []
    resumed.onComplete((c) => completions.push(c))
    resumed.resume(snapshot, { now: clock() })
    expect(resumed.current()).toMatchObject({
      stepIndex: runner.current().stepIndex,
      events: runner.current().events,
      view: { type: 'decision' },
    })

    resumed.dispatch({ kind: 'choice', stepId: 'decision', correct: true })
    resumed.complete()
    resumed.advance()
    resumed.dispatch({ kind: 'choice', stepId: 'transfer', correct: true })
    resumed.complete()
    expect(completions[0]!.attempt).toMatchObject({ stars: 2, hints: 1 })
  })

  it('resume falls back to the factory clock and rejects unknown levels', () => {
    const runner = createLevelRunner({ levels: [fixtureLevel], newId: () => 'x', now: clock() })
    runner.resume({ levelId: fixtureLevel.id, stepIndex: 5, events: [] })
    expect(runner.current().view).toMatchObject({ type: 'transfer' })
    expect(runner.snapshot()).toMatchObject({ seed: 0, startedAt: '2026-01-01T00:00:00.000Z' })
    runner.resume({ levelId: fixtureLevel.id, stepIndex: 5, events: [] }, { seed: 42 })
    expect(runner.snapshot().seed).toBe(42)
    const bare = createLevelRunner({ levels: [], newId: () => 'x' })
    expect(() => bare.resume({ levelId: fixtureLevel.id, stepIndex: 0, events: [] })).toThrow(
      /Unknown level/,
    )
  })

  it('round-trips transfer seed and original start time, preferring snapshot metadata', () => {
    const { runner } = setup(42)
    toDecision(runner)
    runner.dispatch({ kind: 'choice', stepId: 'decision', correct: true })
    runner.complete()
    runner.advance()
    const snapshot = InLevelSnapshotSchema.parse(JSON.parse(JSON.stringify(runner.snapshot())))
    expect(snapshot).toMatchObject({ seed: 42, startedAt: '2026-01-01T00:00:00.000Z' })

    const resumed = createLevelRunner({
      levels: [fixtureLevel],
      newId: () => 'resumed',
      now: () => '2026-01-02T00:00:00.000Z',
    })
    const completions: LevelCompletion[] = []
    resumed.onComplete((completion) => completions.push(completion))
    resumed.resume(snapshot, { seed: 99 })
    expect(resumed.current()).toEqual(runner.current())
    expect(resumed.snapshot()).toEqual(snapshot)
    resumed.dispatch({ kind: 'choice', stepId: 'transfer', correct: true })
    resumed.complete()
    expect(completions[0]!.attempt).toMatchObject({
      startedAt: snapshot.startedAt,
      endedAt: '2026-01-02T00:00:00.000Z',
    })
  })

  it('same seed → same transfer variant; 100 seeds cover every variant', () => {
    const variantFor = (seed: number) => {
      const { runner } = setup(seed)
      toDecision(runner)
      runner.dispatch({ kind: 'choice', stepId: 'decision', correct: true })
      runner.complete()
      runner.advance()
      const view = runner.current().view
      return view?.type === 'transfer' ? view.variantId : undefined
    }
    expect(variantFor(42)).toBe(variantFor(42))
    const seen = new Set(Array.from({ length: 100 }, (_, seed) => variantFor(seed)))
    expect(seen).toEqual(new Set(['v-a', 'v-b', 'v-c']))
  })

  it('arrivedAt with the wrong location does not complete Travel', () => {
    const { runner } = setup()
    runner.advance()
    runner.dispatch({ kind: 'choice', stepId: 'lesson', correct: true })
    runner.complete()
    expect(runner.arrive(loc('market'))).toBe(false)
    expect(runner.dispatch({ kind: 'arrivedAt', locationId: loc('school') })).toBe(false)
    expect(runner.current().view).toMatchObject({ type: 'travel' })
    expect(runner.arrive(loc('bank'))).toBe(true)
    expect(runner.current().view).toMatchObject({ type: 'decision' })
  })

  it('ignores events for other steps and signals on the wrong step type', () => {
    const { runner } = setup()
    const stray: InteractionEvent = { kind: 'choice', stepId: 'decision', correct: true }
    expect(runner.dispatch(stray)).toBe(false)
    expect(runner.arrive(loc('bank'))).toBe(false)
    expect(runner.complete()).toBe(false)
    expect(runner.current()).toMatchObject({ stepIndex: 0, events: [] })
    runner.advance()
    expect(runner.advance()).toBe(false)
    expect(runner.current().stepIndex).toBe(1)
  })

  it('transfer answers keep the level open until completion, preserving the transfer cap', () => {
    const { runner, completions } = setup()
    toDecision(runner)
    runner.dispatch({ kind: 'choice', stepId: 'decision', correct: true })
    runner.complete()
    runner.advance()
    runner.dispatch({
      kind: 'choice',
      stepId: 'transfer',
      correct: false,
      error: 'bank.wrong_document',
      severity: 'minor',
    })
    expect(runner.current().done).toBe(false)
    expect(runner.current().view?.type).toBe('transfer')
    runner.dispatch({ kind: 'choice', stepId: 'transfer', correct: true })
    expect(runner.current().done).toBe(false)
    runner.complete()
    expect(runner.current().done).toBe(true)
    expect(completions[0]!.score.capsApplied).toContain('transfer')
    expect(completions[0]!.score.stars).toBe(2)
    expect(runner.dispatch({ kind: 'choice', stepId: 'transfer', correct: true })).toBe(false)
    expect(runner.complete()).toBe(false)
  })

  it('a critical wrong transfer answer followed by a correct one completes with 1 star', () => {
    const { runner, completions } = setup()
    toDecision(runner)
    runner.dispatch({ kind: 'choice', stepId: 'decision', correct: true })
    runner.complete()
    runner.advance()
    runner.dispatch({
      kind: 'choice',
      stepId: 'transfer',
      correct: false,
      error: 'bank.wrong_document',
      severity: 'critical',
    })
    runner.dispatch({ kind: 'choice', stepId: 'transfer', correct: true })
    runner.complete()
    expect(runner.current().done).toBe(true)
    expect(completions[0]!.score.stars).toBe(1)
    expect(completions[0]!.score.capsApplied).not.toContain('incomplete')
  })

  it('throws before start', () => {
    const runner = createLevelRunner({ levels: [fixtureLevel], newId: () => 'x' })
    expect(() => runner.current()).toThrow(/not started/)
  })
})

describe('contentVersion', () => {
  it('ignores key order and changes when content changes', () => {
    const reordered = Object.fromEntries(
      Object.entries(fixtureLevel).reverse(),
    ) as typeof fixtureLevel
    expect(contentVersion(reordered)).toBe(contentVersion(fixtureLevel))
    expect(contentVersion({ ...fixtureLevel, worldEffects: [] })).not.toBe(
      contentVersion(fixtureLevel),
    )
  })
})

import { describe, expect, it, vi } from 'vitest'
import type { AttemptRecord, LevelId, LocationId, SaveFile } from '@/core/contracts'
import { migrate } from '@/core/state'
import { v1Fixture } from '@/core/state/migrations/fixtures'
import { world } from '@/content/world'
import { fixtureBankLevel } from '../../tests/e2e/fixtures/levels'
import { createGameStore } from './store'

const save = (): SaveFile => ({ ...migrate(structuredClone(v1Fixture)), attempts: [] })
const content = { levels: [fixtureBankLevel], locations: world.locations }
const attempt = (id: string): AttemptRecord => ({
  id,
  levelId: fixtureBankLevel.id as LevelId,
  contentVersion: 'v',
  startedAt: '2026-10-10T00:00:00.000Z',
  endedAt: '2026-10-10T00:01:00.000Z',
  stars: 3,
  errors: [],
  hints: 0,
  worldChoices: { 'bank.accountOpened': 'true' },
})

describe('createGameStore', () => {
  it('runs actions through the reducer and persists each change', () => {
    const persist = vi.fn()
    const store = createGameStore(save(), content, persist)
    store.getState().dispatch({ type: 'travelled', locationId: 'kirana' as LocationId })
    expect(store.getState().save.position.locationId).toBe('kirana')
    expect(persist).toHaveBeenCalledTimes(1)
  })

  it('skips persisting actions that change nothing', () => {
    const persist = vi.fn()
    const store = createGameStore(save(), content, persist)
    store.getState().dispatch({ type: 'stepAdvanced' })
    expect(persist).not.toHaveBeenCalled()
  })

  it('memoizes derive until the attempt log changes', () => {
    const store = createGameStore(save(), content)
    const first = store.derived()
    store.getState().dispatch({ type: 'travelled', locationId: 'bank' as LocationId })
    expect(store.derived()).toBe(first)
    store.getState().dispatch({ type: 'attemptCompleted', attempt: attempt('a1') })
    const next = store.derived()
    expect(next).not.toBe(first)
    expect(next.bestStars[fixtureBankLevel.id]).toBe(3)
    expect(next.worldFlags['bank.accountOpened']).toBe('true')
  })
})

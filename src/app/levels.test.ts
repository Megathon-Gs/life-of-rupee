import { describe, expect, it } from 'vitest'
import type { LevelDef, LocationId } from '@/core/contracts'
import { levels as contentLevels } from '@/content/levels'
import { fixtureBankLevel } from '../../tests/e2e/fixtures/levels'
import { travelTarget } from './Game'
import { attemptSeed, levelAt, levelNamespace, loadLevels, mergeLevels } from './levels'
import { readMode } from './mode'

const at = (id: string) => id as LocationId
const kiranaFixture = { ...fixtureBankLevel, id: 'fixture-kirana', location: 'kirana' } as LevelDef

describe('readMode', () => {
  it('reads test mode and fixtures-only from the query', () => {
    expect(readMode('')).toEqual({ test: false, fixturesOnly: false })
    expect(readMode('?test=1')).toEqual({ test: true, fixturesOnly: false })
    expect(readMode('?test=1&fixtures=only')).toEqual({ test: true, fixturesOnly: true })
    expect(readMode('?fixtures=only')).toEqual({ test: false, fixturesOnly: false })
  })
})

describe('levels', () => {
  it('fills only locations without a real level with fixtures', () => {
    const merged = mergeLevels(contentLevels, [fixtureBankLevel, kiranaFixture], false)
    const open = [at('bank'), at('kirana')]
    expect(levelAt(merged, at('bank'), open)?.id).toBe(
      contentLevels.find((l) => l.location === 'bank')?.id,
    )
    expect(levelAt(merged, at('kirana'), open)?.id).toBe('fixture-kirana')
    expect(mergeLevels(contentLevels, [fixtureBankLevel], true)).toEqual([fixtureBankLevel])
  })

  it('offers no level at a locked location', () => {
    expect(levelAt([fixtureBankLevel], at('bank'), [at('home')])).toBeUndefined()
  })

  it('loads fixtures only in test mode', async () => {
    expect(await loadLevels({ test: false, fixturesOnly: false })).toEqual(contentLevels)
    expect(await loadLevels({ test: true, fixturesOnly: true })).toEqual([fixtureBankLevel])
  })

  it('reads the namespace from the first hook key', () => {
    expect(levelNamespace(fixtureBankLevel)).toBe('app')
    expect(levelNamespace(contentLevels[0]!)).toBe('l02')
  })

  it('gives each attempt a stable seed', () => {
    expect(attemptSeed('p', 'l', 0)).toBe(attemptSeed('p', 'l', 0))
    expect(attemptSeed('p', 'l', 0)).not.toBe(attemptSeed('p', 'l', 1))
  })
})

describe('travelTarget', () => {
  it('steps one stop and stops at the street ends', () => {
    expect(travelTarget(at('home'), { kind: 'step', dir: 1 })).toBe('bank')
    expect(travelTarget(at('home'), { kind: 'step', dir: -1 })).toBe('home')
    expect(travelTarget(at('filler-2'), { kind: 'step', dir: 1 })).toBe('filler-2')
    expect(travelTarget(at('home'), { kind: 'goto', id: at('kirana') })).toBe('kirana')
    expect(travelTarget(at('home'), { kind: 'goto', id: at('nowhere') })).toBe('home')
  })
})

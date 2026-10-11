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

  it('offers the first not-yet-completed level when a location hosts several', () => {
    const l4 = { ...fixtureBankLevel, id: 'l04', location: 'phone-shop' } as LevelDef
    const l5 = { ...fixtureBankLevel, id: 'l05', location: 'phone-shop' } as LevelDef
    const open = [at('phone-shop')]
    expect(levelAt([l4, l5], at('phone-shop'), open)?.id).toBe('l04')
    expect(levelAt([l4, l5], at('phone-shop'), open, ['l04'])?.id).toBe('l05')
    expect(levelAt([l4, l5], at('phone-shop'), open, ['l04', 'l05'])?.id).toBe('l04')
  })

  it('offers Level 12 at home only after Level 11 is completed', () => {
    const l1 = { ...fixtureBankLevel, id: 'l01-budget', location: 'home' } as LevelDef
    const l12 = { ...fixtureBankLevel, id: 'l12-capstone', location: 'home' } as LevelDef
    const open = [at('home')]
    expect(levelAt([l1, l12], at('home'), open)?.id).toBe('l01-budget')
    expect(levelAt([l1, l12], at('home'), open, ['l01-budget'])?.id).toBe('l01-budget')
    expect(levelAt([l1, l12], at('home'), open, ['l01-budget', 'l11-investing'])?.id).toBe(
      'l12-capstone',
    )
    expect(levelAt([l12], at('home'), open)).toBeUndefined()
  })

  it('loads fixtures only in test mode', async () => {
    expect(await loadLevels({ test: false, fixturesOnly: false })).toEqual(contentLevels)
    expect(await loadLevels({ test: true, fixturesOnly: true })).toEqual([fixtureBankLevel])
  })

  it('reads the namespace from the first hook key', () => {
    expect(levelNamespace(fixtureBankLevel)).toBe('app')
    expect(levelNamespace(contentLevels[1]!)).toBe('l02')
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
    expect(travelTarget(at('filler-2'), { kind: 'step', dir: 1 })).toBe('phone-shop')
    expect(travelTarget(at('capstone'), { kind: 'step', dir: 1 })).toBe('capstone')
    expect(travelTarget(at('home'), { kind: 'goto', id: at('kirana') })).toBe('kirana')
    expect(travelTarget(at('home'), { kind: 'goto', id: at('nowhere') })).toBe('home')
  })
})

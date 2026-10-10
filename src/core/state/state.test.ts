import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { SaveFileSchema, type AttemptRecord, type LevelDef, type SaveFile } from '../contracts'
import { derive, merge, migrate, MigrationError, reducer, type Action } from './index'
import { v1Fixture } from './migrations/fixtures'

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T
const save = (): SaveFile => migrate(clone(v1Fixture))
const att = (
  id: string,
  stars: 0 | 1 | 2 | 3,
  endedAt: string,
  extra: Partial<AttemptRecord> = {},
) => ({ ...save().attempts[0]!, id, stars, endedAt, startedAt: endedAt, ...extra }) as AttemptRecord

const level = {
  id: 'l02-bank-account',
  skillNodes: ['bank.account'],
  location: 'bank',
  worldEffects: [{ key: 'bank.accountOpened', value: 'true' }],
} as unknown as LevelDef
const content = {
  levels: [level],
  locations: [{ id: 'home' }, { id: 'bank', unlockedBy: ['l02-bank-account'] }],
} as never

describe('derive', () => {
  it('best and first stars', () => {
    const s = { ...save(), attempts: [att('a', 2, '2026-02-01'), att('b', 3, '2026-02-02')] }
    const d = derive(s, content)
    expect(d.bestStars['l02-bank-account']).toBe(3)
    expect(d.firstStars['l02-bank-account']).toBe(2)
  })
  it('world flags, skills, unlocks, wallet', () => {
    const s = {
      ...save(),
      attempts: [
        att('a', 1, '2026-02-01', { worldChoices: { 'wallet.delta': '-500', vehicle: 'bike' } }),
      ],
    }
    const d = derive(s, content)
    expect(d.worldFlags['bank.accountOpened']).toBe('true')
    expect(d.worldFlags.vehicle).toBe('bike')
    expect(d.skills).toEqual(['bank.account'])
    expect(d.unlockedLocations).toEqual(['home', 'bank'])
    expect(d.wallet).toBe(-500)
    expect(derive({ ...s, attempts: [] }, content).unlockedLocations).toEqual(['home'])
  })
})

const attemptArb = fc
  .record({
    id: fc.constantFrom('a', 'b', 'c', 'd'),
    stars: fc.constantFrom(0, 1, 2, 3) as fc.Arbitrary<0 | 1 | 2 | 3>,
    endedAt: fc.constantFrom('2026-01-01', '2026-01-02', '2026-01-03'),
  })
  .map((r) => att(r.id, r.stars, r.endedAt, { startedAt: r.endedAt }))
// Same id means same record across devices (append-only log).
const attemptsArb = fc
  .array(attemptArb, { maxLength: 5 })
  .map((xs) => [...new Map(xs.map((x) => [x.id, x])).values()])
const saveArb = fc
  .record({
    attempts: attemptsArb,
    updatedAt: fc.constantFrom('2026-01-01', '2026-02-01'),
    muted: fc.boolean(),
    seen: fc.array(fc.constantFrom('x', 'y', 'z')),
  })
  .map((r) => {
    const s = save()
    return {
      ...s,
      attempts: r.attempts,
      seen: r.seen,
      settings: { ...s.settings, muted: r.muted, updatedAt: r.updatedAt },
    }
  })

describe('merge', () => {
  it('commutative, associative, idempotent', () => {
    fc.assert(
      fc.property(saveArb, saveArb, saveArb, (a, b, c) => {
        expect(merge(a, b)).toEqual(merge(b, a))
        expect(merge(merge(a, b), c)).toEqual(merge(a, merge(b, c)))
        expect(merge(a, a).attempts).toEqual(merge(a, a).attempts)
        expect(merge(merge(a, b), b)).toEqual(merge(a, b))
        expect(merge(a, a).attempts.map((x) => x.id)).toEqual(
          [...a.attempts]
            .sort((x, y) => (x.endedAt + x.id < y.endedAt + y.id ? -1 : 1))
            .map((x) => x.id),
        )
      }),
    )
  })
  it('settings latest wins; position from latest attempt', () => {
    const a = {
      ...save(),
      attempts: [att('a', 1, '2026-01-01')],
      position: { locationId: 'bank' },
    } as SaveFile
    const b = {
      ...save(),
      attempts: [att('b', 1, '2026-01-02')],
      position: { locationId: 'park' },
      settings: { ...save().settings, muted: true, updatedAt: '2027-01-01' },
    } as SaveFile
    const m = merge(a, b)
    expect(m.position.locationId).toBe('park')
    expect(m.settings.muted).toBe(true)
    expect(m.attempts).toHaveLength(2)
  })
})

describe('reducer', () => {
  const actions: Action[] = [
    { type: 'travelled', locationId: 'bank' as never },
    { type: 'levelStarted', levelId: 'l02-bank-account' as never },
    { type: 'eventRecorded', event: { kind: 'explanationOpened', stepId: 's' } },
    { type: 'stepAdvanced' },
    { type: 'attemptCompleted', attempt: att('z', 3, '2026-03-01') },
    { type: 'settingsUpdated', patch: { muted: true }, updatedAt: '2026-03-01' },
    { type: 'transitionSeen', id: 't' },
    { type: 'profileCreated', localId: 'n', locationId: 'home' as never, now: '2026-01-01' },
  ]
  it('is pure and produces valid saves', () => {
    for (const a of actions) {
      const s = save()
      const frozen = clone(s)
      const out = reducer(s, a)
      expect(s).toEqual(frozen)
      expect(reducer(clone(s), a)).toEqual(out)
      expect(SaveFileSchema.safeParse(out).success).toBe(true)
    }
  })
  it('flows through a level', () => {
    let s = save()
    for (const a of actions.slice(1, 5)) s = reducer(s, a)
    expect(s.position.inLevel).toBeUndefined()
    expect(s.attempts).toHaveLength(2)
    expect(reducer(s, actions[4]!)).toBe(s)
  })
})

describe('migrate', () => {
  it('v1 fixture passes schema', () => {
    expect(SaveFileSchema.safeParse(migrate(v1Fixture)).success).toBe(true)
  })
  it('throws MigrationError with no path', () => {
    expect(() => migrate({ ...v1Fixture, schemaVersion: 0 })).toThrow(MigrationError)
    expect(() => migrate({ ...v1Fixture, schemaVersion: 99 })).toThrow(MigrationError)
    expect(() => migrate(null)).toThrow(MigrationError)
  })
})

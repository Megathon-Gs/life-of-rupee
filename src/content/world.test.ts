import { describe, expect, it } from 'vitest'
import { WorldDefSchema } from '@/core/contracts'
import { world } from './world'

describe('world content', () => {
  it('validates against WorldDefSchema', () => {
    expect(WorldDefSchema.safeParse(world).success).toBe(true)
  })

  it('lists the P0 street in order', () => {
    expect(world.locations.map((l) => l.id)).toEqual([
      'home',
      'bank',
      'kirana',
      'filler-1',
      'filler-2',
    ])
  })

  it('snaps every x to the 16 px grid, strictly increasing', () => {
    const xs = world.locations.map((l) => l.x)
    for (const x of xs) expect(x % 16).toBe(0)
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeGreaterThan(xs[i - 1]!)
  })

  it('runs urban → high-street → rural-connected', () => {
    const rank: Record<string, number> = { urban: 0, 'high-street': 1, 'rural-connected': 2 }
    const ranks = world.locations.map((l) => rank[l.district])
    for (let i = 1; i < ranks.length; i++) expect(ranks[i]!).toBeGreaterThanOrEqual(ranks[i - 1]!)
    expect(new Set(world.locations.map((l) => l.district))).toEqual(
      new Set(['urban', 'high-street', 'rural-connected']),
    )
  })

  it('gives every location a door and a world-namespace label key', () => {
    for (const l of world.locations) {
      expect(l.labelKey.startsWith('loc.')).toBe(true)
      expect(l.doorX).toBeGreaterThanOrEqual(0)
    }
  })
})
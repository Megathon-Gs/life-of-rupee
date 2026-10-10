import { describe, expect, it } from 'vitest'
import { LocationIdSchema, type Derived } from '../contracts'
import { deriveWorldVisuals } from './derive'

const fresh: Derived = {
  bestStars: {},
  firstStars: {},
  skills: [],
  unlockedLocations: [],
  worldFlags: {},
  wallet: 0,
}

describe('P1 world visuals', () => {
  it('keeps fresh state unchanged and hides the capstone unless enabled', () => {
    expect(deriveWorldVisuals(fresh)).toEqual({})
    expect(deriveWorldVisuals(fresh, { features: { capstone: false } })).toEqual({})
    expect(deriveWorldVisuals(fresh, { features: { capstone: true } })).toEqual({
      capstone: 'locked',
    })
  })

  it('lights each unlocked shop and remembers warning signs at the phone shop', () => {
    expect(
      deriveWorldVisuals({ ...fresh, unlockedLocations: [LocationIdSchema.parse('phone-shop')] }),
    ).toEqual({
      'phone-shop': 'lit',
    })
    expect(
      deriveWorldVisuals({ ...fresh, unlockedLocations: [LocationIdSchema.parse('showroom')] }),
    ).toEqual({
      showroom: 'lit',
    })
    expect(
      deriveWorldVisuals({ ...fresh, worldFlags: { 'fraud.seenWarningSigns': 'true' } }),
    ).toEqual({ 'phone-shop': 'recognises' })
    expect(
      deriveWorldVisuals({
        ...fresh,
        unlockedLocations: [
          LocationIdSchema.parse('phone-shop'),
          LocationIdSchema.parse('showroom'),
        ],
        worldFlags: { 'fraud.seenWarningSigns': 'true' },
      }),
    ).toEqual({ 'phone-shop': 'lit-recognises', showroom: 'lit' })
  })
})

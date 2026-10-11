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

describe('P2 world consequences', () => {
  it('upgrades the home exterior and interior only after the savings goal', () => {
    expect(deriveWorldVisuals(fresh)).not.toHaveProperty('home')
    expect(
      deriveWorldVisuals({ ...fresh, worldFlags: { 'savings.goalMet': 'false' } }),
    ).not.toHaveProperty('home')
    expect(deriveWorldVisuals({ ...fresh, worldFlags: { 'savings.goalMet': 'true' } })).toEqual({
      home: 'upgraded',
      'home.interior': 'upgraded',
    })
  })

  it('marks a recurring installment at home and in the HUD wallet', () => {
    expect(deriveWorldVisuals(fresh)).not.toHaveProperty('home.repayment')
    expect(
      deriveWorldVisuals({ ...fresh, worldFlags: { 'loan.activeInstallment': 'false' } }),
    ).toEqual({})
    expect(
      deriveWorldVisuals({ ...fresh, worldFlags: { 'loan.activeInstallment': 'true' } }),
    ).toEqual({
      'home.repayment': 'active',
      'hud.wallet': 'repayment',
    })
  })

  it('has the insurance desk agent recognise a player who inspected a policy', () => {
    expect(deriveWorldVisuals(fresh)).not.toHaveProperty('insurance-desk')
    expect(
      deriveWorldVisuals({ ...fresh, worldFlags: { 'insurance.policyInspected': 'false' } }),
    ).toEqual({})
    expect(
      deriveWorldVisuals({ ...fresh, worldFlags: { 'insurance.policyInspected': 'true' } }),
    ).toEqual({
      'insurance-desk': 'recognises',
    })
  })

  it('opens the completed curriculum capstone only with its feature enabled', () => {
    const completed: Derived = { ...fresh, worldFlags: { 'curriculum.completed': 'true' } }
    const incomplete: Derived = { ...fresh, worldFlags: { 'curriculum.completed': 'false' } }
    expect(deriveWorldVisuals(incomplete, { features: { capstone: true } })).toEqual({
      capstone: 'locked',
    })
    expect(deriveWorldVisuals(completed, { features: { capstone: false } })).toEqual({
      capstone: 'locked',
    })
    expect(deriveWorldVisuals(completed, { features: { capstone: true } })).toEqual({
      capstone: 'open',
    })
  })

  it('lights a district when one of its P2 level locations is unlocked', () => {
    expect(deriveWorldVisuals(fresh)).not.toHaveProperty('district.high-street')
    expect(deriveWorldVisuals(fresh)).not.toHaveProperty('district.rural-connected')
    expect(
      deriveWorldVisuals({ ...fresh, unlockedLocations: [LocationIdSchema.parse('market')] }),
    ).toEqual({
      'district.high-street': 'lit',
    })
    expect(
      deriveWorldVisuals({ ...fresh, unlockedLocations: [LocationIdSchema.parse('workplace')] }),
    ).toEqual({
      'district.high-street': 'lit',
    })
    expect(
      deriveWorldVisuals({
        ...fresh,
        unlockedLocations: [LocationIdSchema.parse('insurance-desk')],
      }),
    ).toEqual({
      'district.rural-connected': 'lit',
    })
    expect(
      deriveWorldVisuals({
        ...fresh,
        unlockedLocations: [LocationIdSchema.parse('learning-centre')],
      }),
    ).toEqual({
      'district.rural-connected': 'lit',
    })
  })

  it('returns the same visuals without mutating its input', () => {
    const derived: Derived = {
      ...fresh,
      unlockedLocations: [LocationIdSchema.parse('market')],
      worldFlags: { 'savings.goalMet': 'true', 'loan.activeInstallment': 'true' },
    }
    expect(deriveWorldVisuals(derived)).toEqual(deriveWorldVisuals(derived))
    expect(derived.unlockedLocations).toEqual(['market'])
    expect(derived.worldFlags).toEqual({
      'savings.goalMet': 'true',
      'loan.activeInstallment': 'true',
    })
  })
})

import { describe, expect, it } from 'vitest'
import type { Derived } from '../contracts'
import { deriveWorldVisuals } from './derive'

const fresh: Derived = {
  bestStars: {},
  firstStars: {},
  skills: [],
  unlockedLocations: [],
  worldFlags: {},
  wallet: 0,
}

describe('deriveWorldVisuals', () => {
  it('shows the default bank teller on fresh state', () => {
    expect(deriveWorldVisuals(fresh)).toEqual({})
  })

  it('greets the player once the account is opened', () => {
    const opened: Derived = { ...fresh, worldFlags: { 'bank.accountOpened': 'true' } }
    expect(deriveWorldVisuals(opened)).toEqual({ bank: 'greets' })
  })

  it('treats any other flag value as not opened', () => {
    const other: Derived = { ...fresh, worldFlags: { 'bank.accountOpened': 'false' } }
    expect(deriveWorldVisuals(other)).toEqual({})
  })

  it('is pure — does not mutate its input', () => {
    const input: Derived = { ...fresh, worldFlags: { 'bank.accountOpened': 'true' } }
    deriveWorldVisuals(input)
    expect(input.worldFlags).toEqual({ 'bank.accountOpened': 'true' })
  })
})

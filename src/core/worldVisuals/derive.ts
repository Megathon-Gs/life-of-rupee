import type { Derived, WorldVisuals } from '../contracts'

/**
 * Maps saved world flags to renderer visual variants — "world change is
 * derived, never stored twice" (technical implementation plan). Pure: same
 * `derived` always yields the same town.
 */
export function deriveWorldVisuals(derived: Derived): WorldVisuals {
  return {
    bankTeller: derived.worldFlags['bank.accountOpened'] === 'true' ? 'greets' : 'default',
  }
}
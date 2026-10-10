import type { AppConfig, Derived, WorldVisuals } from '../contracts'

/**
 * Maps saved world flags to renderer visual variants — "world change is
 * derived, never stored twice" (technical implementation plan). Pure: same
 * `derived` always yields the same town.
 */
export function deriveWorldVisuals(derived: Derived, config?: AppConfig): WorldVisuals {
  const visuals: WorldVisuals = {}
  if (derived.worldFlags['bank.accountOpened'] === 'true') visuals.bank = 'greets'
  if (derived.unlockedLocations.some((id) => id === 'phone-shop')) visuals['phone-shop'] = 'lit'
  if (derived.unlockedLocations.some((id) => id === 'showroom')) visuals.showroom = 'lit'
  if (derived.worldFlags['fraud.seenWarningSigns'] === 'true') {
    visuals['phone-shop'] = visuals['phone-shop'] === 'lit' ? 'lit-recognises' : 'recognises'
  }
  if (config?.features.capstone) visuals.capstone = 'locked'
  return visuals
}

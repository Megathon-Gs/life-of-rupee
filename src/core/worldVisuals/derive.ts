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
  if (derived.worldFlags['savings.goalMet'] === 'true') {
    visuals.home = 'upgraded'
    visuals['home.interior'] = 'upgraded'
  }
  if (derived.worldFlags['loan.activeInstallment'] === 'true') {
    visuals['home.repayment'] = 'active'
    visuals['hud.wallet'] = 'repayment'
  }
  if (derived.worldFlags['insurance.policyInspected'] === 'true') {
    visuals['insurance-desk'] = 'recognises'
  }
  if (derived.unlockedLocations.some((id) => id === 'market' || id === 'workplace')) {
    visuals['district.high-street'] = 'lit'
  }
  if (derived.unlockedLocations.some((id) => id === 'insurance-desk' || id === 'learning-centre')) {
    visuals['district.rural-connected'] = 'lit'
  }
  if (config?.features.capstone || derived.worldFlags['curriculum.completed'] === 'true') {
    visuals.capstone =
      config?.features.capstone && derived.worldFlags['curriculum.completed'] === 'true'
        ? 'open'
        : 'locked'
  }
  return visuals
}

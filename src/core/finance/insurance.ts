import { requireNonNegative, type Paise } from './money'

export type Policy = {
  covered: readonly string[]
  exclusions: readonly string[]
  deductible: Paise
  cap: Paise
}

export type InsuranceEvent = { kind: string; loss: Paise }

export type ClaimOutcome = {
  covered: boolean
  payout: Paise
  youPay: Paise
  reason: 'excluded' | 'not_covered' | 'within_deductible' | 'capped' | 'covered'
}

/** Maintenance is wear and tear, never an insurable event, whatever the policy lists. */
const NEVER_COVERED = 'maintenance'

export function claimOutcome(policy: Policy, event: InsuranceEvent): ClaimOutcome {
  requireNonNegative(event.loss, 'Loss')
  requireNonNegative(policy.deductible, 'Deductible')
  requireNonNegative(policy.cap, 'Cap')
  const none = (reason: ClaimOutcome['reason']): ClaimOutcome => ({
    covered: false,
    payout: 0 as Paise,
    youPay: event.loss,
    reason,
  })
  if (event.kind === NEVER_COVERED || policy.exclusions.includes(event.kind)) {
    return none('excluded')
  }
  if (!policy.covered.includes(event.kind)) return none('not_covered')
  const afterDeductible = Math.max(0, event.loss - policy.deductible)
  if (afterDeductible === 0) return none('within_deductible')
  const payout = Math.min(afterDeductible, policy.cap)
  return {
    covered: true,
    payout: payout as Paise,
    youPay: (event.loss - payout) as Paise,
    reason: payout < afterDeductible ? 'capped' : 'covered',
  }
}

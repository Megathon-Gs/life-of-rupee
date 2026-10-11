import { requireNonNegative, requirePositiveInteger, roundPaise, type Paise } from './money'

const MAX_MONTHS = 1200

/** Months of equal end-of-month deposits, earning monthly-compounded interest, to reach target. */
export function monthsToGoal(target: Paise, monthly: Paise, annualRatePct: number): number {
  requireNonNegative(target, 'Target')
  requirePositiveInteger(monthly, 'Monthly saving')
  requireNonNegative(annualRatePct, 'Annual rate')
  const r = annualRatePct / 100 / 12
  let balance = 0
  for (let month = 0; month <= MAX_MONTHS; month++) {
    if (balance >= target) return month
    balance = roundPaise(balance * (1 + r)) + monthly
  }
  throw new RangeError('Goal not reached within 100 years')
}

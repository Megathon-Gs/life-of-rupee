import { requireNonNegative, requirePositiveInteger, roundPaise, type Paise } from './money'

export function compound(
  principal: Paise,
  annualRatePct: number,
  periodsPerYear: number,
  years: number,
): Paise {
  requireNonNegative(principal, 'Principal')
  requireNonNegative(annualRatePct, 'Annual rate')
  requirePositiveInteger(periodsPerYear, 'Periods per year')
  requireNonNegative(years, 'Years')
  return roundPaise(
    principal * (1 + annualRatePct / 100 / periodsPerYear) ** (periodsPerYear * years),
  )
}

export function simple(principal: Paise, annualRatePct: number, years: number): Paise {
  requireNonNegative(principal, 'Principal')
  requireNonNegative(annualRatePct, 'Annual rate')
  requireNonNegative(years, 'Years')
  return roundPaise(principal * (1 + (annualRatePct / 100) * years))
}

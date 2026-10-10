import { requireNonNegative, roundPaise, type Paise } from './money'

export function priceAfter(price: Paise, ratePct: number, years: number): Paise {
  requireNonNegative(price, 'Price')
  requireNonNegative(ratePct, 'Inflation rate')
  requireNonNegative(years, 'Years')
  return roundPaise(price * (1 + ratePct / 100) ** years)
}

export function purchasingPower(ratePct: number, years: number): Paise {
  requireNonNegative(ratePct, 'Inflation rate')
  requireNonNegative(years, 'Years')
  return roundPaise(100 / (1 + ratePct / 100) ** years)
}

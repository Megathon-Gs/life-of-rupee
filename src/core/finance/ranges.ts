import { requireNonNegative, roundPaise, type Paise } from './money'

/** An illustrative low-to-high range. There is deliberately no single "expected" value. */
export function illustrativeRange(
  principal: Paise,
  years: number,
  lowPct: number,
  highPct: number,
): { low: Paise; high: Paise } {
  requireNonNegative(principal, 'Principal')
  requireNonNegative(years, 'Years')
  if (!Number.isFinite(lowPct) || !Number.isFinite(highPct) || lowPct > highPct || lowPct <= -100) {
    throw new RangeError('Rates must satisfy -100 < low <= high')
  }
  const grow = (pct: number) => roundPaise(principal * (1 + pct / 100) ** years)
  return { low: grow(lowPct), high: grow(highPct) }
}

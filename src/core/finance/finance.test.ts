import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { emi, loanTotals, schedule } from './emi'
import { compound, simple } from './interest'
import { priceAfter, purchasingPower } from './inflation'
import { formatINR, rupees, toRupees } from './money'

describe('finance maths', () => {
  it('converts and formats integer paise', () => {
    expect(rupees(1.005)).toBe(101)
    expect(toRupees(rupees(1234.56))).toBe(1234.56)
    expect(formatINR(rupees(100000), 'en-IN')).toBe('₹1,00,000.00')
  })

  it('matches the specified examples', () => {
    expect(emi(rupees(100000), 12, 12)).toBe(888488)
    expect(compound(rupees(10000), 7, 4, 1)).toBe(1071859)
  })

  it('builds a schedule with exact principal repayment and zero ending balance', () => {
    const rows = schedule(rupees(100000), 12, 12)
    expect(rows.reduce((sum, row) => sum + row.principalPaid, 0)).toBe(rupees(100000))
    expect(rows.at(-1)?.balance).toBe(0)
    expect(loanTotals(rupees(100000), 12, 12).totalRepaid).toBe(
      rows.reduce((sum, row) => sum + row.principalPaid + row.interestPaid, 0),
    )
  })

  it('keeps loan fees separate from interest', () => {
    const totals = loanTotals(rupees(60_000), 12, 12, rupees(600))
    expect(totals.totalInterest).toBe(rupees(3_971.13))
    expect(totals.totalRepaid).toBe(rupees(64_571.13))
  })

  it('keeps EMI accurate for a very small positive rate', () => {
    expect(emi(rupees(1000), 1e-12, 12)).toBe(8333)
  })

  it('keeps loan totals and purchasing-power lessons true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 100_000_000 }),
        fc.integer({ min: 0, max: 3000 }),
        fc.integer({ min: 1, max: 240 }),
        (principal, rate, months) => {
          const p = principal as ReturnType<typeof rupees>
          expect(
            loanTotals(p, rate / 100, months, 100 as ReturnType<typeof rupees>).totalRepaid,
          ).toBeGreaterThanOrEqual(p)
          expect(
            schedule(p, rate / 100, months).reduce((sum, row) => sum + row.principalPaid, 0),
          ).toBeCloseTo(p, 0)
        },
      ),
    )
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (rate, years) => {
          expect(purchasingPower(rate, years)).toBeLessThan(purchasingPower(rate, years - 1))
          expect(priceAfter(rupees(100), rate, years)).toBeGreaterThan(rupees(100))
        },
      ),
    )
  })

  it('longer tenure lowers EMI and increases total interest', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1_000_000, max: 10_000_000 }),
        fc.integer({ min: 100, max: 3000 }),
        fc.integer({ min: 1, max: 50 }),
        (principal, rate, shortMonths) => {
          const longMonths = shortMonths + 1
          const p = principal as ReturnType<typeof rupees>
          expect(emi(p, rate / 100, longMonths)).toBeLessThan(emi(p, rate / 100, shortMonths))
          expect(loanTotals(p, rate / 100, longMonths).totalInterest).toBeGreaterThan(
            loanTotals(p, rate / 100, shortMonths).totalInterest,
          )
        },
      ),
    )
  })

  it('matches an exact BigInt reference within one paisa', () => {
    const principal = rupees(100000)
    const months = 12
    const numerator = BigInt(principal) * 101n ** BigInt(months)
    const denominator = 100n * (101n ** BigInt(months) - 100n ** BigInt(months))
    const reference = Number((numerator * 2n + denominator) / (2n * denominator))
    expect(Math.abs(emi(principal, 12, months) - reference)).toBeLessThanOrEqual(1)

    const round = (n: bigint, d: bigint) => Number((2n * n + d) / (2n * d))
    const quarterGrowth = 407n ** 4n
    const quarterDenominator = 400n ** 4n
    expect(compound(rupees(10000), 7, 4, 1)).toBe(
      round(BigInt(rupees(10000)) * quarterGrowth, quarterDenominator),
    )
    expect(simple(rupees(100), 7, 3)).toBe(round(BigInt(rupees(100)) * 121n, 100n))
    expect(priceAfter(rupees(100), 2, 3)).toBe(round(BigInt(rupees(100)) * 1061208n, 1000000n))
    expect(purchasingPower(2, 3)).toBe(round(100n * 1000000n, 1061208n))
  })
})

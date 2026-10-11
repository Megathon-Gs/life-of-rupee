import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { claimOutcome, type Policy } from './insurance'
import { monthsToGoal } from './goals'
import { payslip } from './payslip'
import { illustrativeRange } from './ranges'
import { receiptTotals } from './receipt'
import { rupees, type Paise } from './money'

const paise = (min: number, max: number) => fc.integer({ min, max }).map((n) => n as Paise)

describe('P2 finance maths', () => {
  it('receipt: total = taxable + tax; bigger discount never raises total; matches reference', () => {
    expect(
      receiptTotals([{ unitPrice: rupees(100), quantity: 3 }], {
        discount: rupees(50),
        taxRatePct: 18,
        taxOnDiscounted: true,
      }),
    ).toEqual({ subtotal: 30000, discount: 5000, taxable: 25000, tax: 4500, total: 29500 })
    fc.assert(
      fc.property(
        fc.array(fc.record({ unitPrice: paise(0, 1e6), quantity: fc.nat(20) }), { maxLength: 8 }),
        paise(0, 1e7),
        paise(0, 1e7),
        fc.integer({ min: 0, max: 40 }),
        fc.boolean(),
        (lines, d1, d2, taxRatePct, taxOnDiscounted) => {
          const [lo, hi] = d1 <= d2 ? [d1, d2] : [d2, d1]
          const a = receiptTotals(lines, { discount: lo, taxRatePct, taxOnDiscounted })
          const b = receiptTotals(lines, { discount: hi, taxRatePct, taxOnDiscounted })
          expect(a.total).toBe(a.taxable + a.tax)
          expect(b.total).toBeLessThanOrEqual(a.total)
        },
      ),
    )
  })

  it('payslip: net = gross − deductions and never exceeds gross', () => {
    const p = payslip(rupees(20000), [
      { label: 'Fund', percent: 12 },
      { label: 'Fee', amount: rupees(200) },
    ])
    expect(p).toMatchObject({ totalDeductions: 260000, net: 1740000 })
    fc.assert(
      fc.property(
        paise(0, 1e8),
        fc.array(
          fc.oneof(
            fc.record({ label: fc.constant('a'), amount: paise(0, 1e8) }),
            fc.record({ label: fc.constant('b'), percent: fc.integer({ min: 0, max: 100 }) }),
          ),
          { maxLength: 5 },
        ),
        (gross, deductions) => {
          const s = payslip(gross, deductions)
          expect(s.net).toBe(s.gross - s.totalDeductions)
          expect(s.net).toBeGreaterThanOrEqual(0)
          expect(s.net).toBeLessThanOrEqual(s.gross)
        },
      ),
    )
  })

  it('claims: payout + youPay = loss, payout ≤ cap, excluded pays 0', () => {
    const policy = (deductible: Paise, cap: Paise): Policy => ({
      covered: ['theft', 'fire', 'maintenance'],
      exclusions: ['fire'],
      deductible,
      cap,
    })
    expect(
      claimOutcome(policy(rupees(500), rupees(5000)), { kind: 'theft', loss: rupees(2000) }),
    ).toEqual({ covered: true, payout: 150000, youPay: 50000, reason: 'covered' })
    expect(
      claimOutcome(policy(0 as Paise, rupees(1000)), { kind: 'theft', loss: rupees(2000) }).reason,
    ).toBe('capped')
    expect(
      claimOutcome(policy(0 as Paise, rupees(9e3)), { kind: 'maintenance', loss: rupees(1) })
        .reason,
    ).toBe('excluded')
    fc.assert(
      fc.property(
        paise(0, 1e7),
        paise(0, 1e7),
        paise(0, 1e8),
        fc.constantFrom('theft', 'fire', 'maintenance', 'flood'),
        (deductible, cap, loss, kind) => {
          const o = claimOutcome(policy(deductible, cap), { kind, loss: loss })
          expect(o.payout + o.youPay).toBe(loss)
          expect(o.payout).toBeLessThanOrEqual(cap)
          if (kind === 'fire' || kind === 'maintenance') {
            expect(o.payout).toBe(0)
            expect(o.reason).toBe('excluded')
          }
        },
      ),
    )
  })

  it('goal: months to reach a target, faster with interest', () => {
    expect(monthsToGoal(rupees(1000), rupees(100), 0)).toBe(10)
    expect(monthsToGoal(rupees(0), rupees(100), 5)).toBe(0)
    expect(monthsToGoal(rupees(100000), rupees(1000), 12)).toBeLessThan(100)
    expect(() => monthsToGoal(rupees(1e9), rupees(1), 0)).toThrow(RangeError)
  })

  it('range: low ≤ high and a negative low can fall below principal', () => {
    expect(illustrativeRange(rupees(10000), 2, -10, 10)).toEqual({ low: 810000, high: 1210000 })
    fc.assert(
      fc.property(
        paise(1, 1e8),
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: -50, max: 20 }),
        fc.integer({ min: 0, max: 30 }),
        (principal, years, low, extra) => {
          const r = illustrativeRange(principal, years, low, low + extra)
          expect(r.low).toBeLessThanOrEqual(r.high)
        },
      ),
    )
  })
})

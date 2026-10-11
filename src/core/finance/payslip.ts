import { requireNonNegative, roundPaise, type Paise } from './money'

/** A fictional deduction: a fixed amount, or a percentage of gross. */
export type Deduction = { label: string } & ({ amount: Paise } | { percent: number })

export type Payslip = {
  gross: Paise
  deductions: { label: string; amount: Paise }[]
  totalDeductions: Paise
  net: Paise
}

export function payslip(gross: Paise, deductions: readonly Deduction[]): Payslip {
  requireNonNegative(gross, 'Gross')
  const resolved = deductions.map((d) => {
    if ('amount' in d) {
      requireNonNegative(d.amount, 'Deduction')
      return { label: d.label, amount: d.amount }
    }
    requireNonNegative(d.percent, 'Deduction percent')
    return { label: d.label, amount: roundPaise((gross * d.percent) / 100) }
  })
  const totalDeductions = Math.min(
    gross,
    resolved.reduce((sum, d) => sum + d.amount, 0),
  )
  return {
    gross,
    deductions: resolved,
    totalDeductions: totalDeductions as Paise,
    net: (gross - totalDeductions) as Paise,
  }
}

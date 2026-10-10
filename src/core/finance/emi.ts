import { requireNonNegative, requirePositiveInteger, roundPaise, type Paise } from './money'

export type ScheduleRow = {
  principalPaid: Paise
  interestPaid: Paise
  balance: Paise
}

export function emi(principal: Paise, annualRatePct: number, months: number): Paise {
  requireNonNegative(principal, 'Principal')
  requireNonNegative(annualRatePct, 'Annual rate')
  requirePositiveInteger(months, 'Months')
  const monthlyRate = annualRatePct / 1200
  if (monthlyRate === 0) return roundPaise(principal / months)
  const denominator = -Math.expm1(-months * Math.log1p(monthlyRate))
  return roundPaise((principal * monthlyRate) / denominator)
}

export function schedule(principal: Paise, annualRatePct: number, months: number): ScheduleRow[] {
  requireNonNegative(principal, 'Principal')
  const payment = emi(principal, annualRatePct, months)
  let balance = principal
  const rows: ScheduleRow[] = []
  for (let month = 0; month < months; month++) {
    const interestPaid = roundPaise((balance * annualRatePct) / 1200)
    const principalPaid =
      month === months - 1
        ? (balance as Paise)
        : (Math.min(balance, Math.max(0, payment - interestPaid)) as Paise)
    balance = (balance - principalPaid) as Paise
    rows.push({ principalPaid, interestPaid, balance })
  }
  return rows
}

export function loanTotals(
  principal: Paise,
  annualRatePct: number,
  months: number,
  fees: Paise = 0 as Paise,
): { emi: Paise; totalRepaid: Paise; totalInterest: Paise } {
  requireNonNegative(fees, 'Fees')
  const payment = emi(principal, annualRatePct, months)
  const interest = schedule(principal, annualRatePct, months).reduce(
    (total, row) => total + row.interestPaid,
    0,
  )
  const totalRepaid = roundPaise(principal + interest + fees)
  return {
    emi: payment,
    totalRepaid,
    totalInterest: (totalRepaid - principal) as Paise,
  }
}

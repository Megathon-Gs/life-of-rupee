import { requireNonNegative, roundPaise, type Paise } from './money'

export type ReceiptLine = { unitPrice: Paise; quantity: number }

export type ReceiptOptions = {
  discount: Paise
  taxRatePct: number
  /** true: tax on the price after discount. false: tax on the price before discount. */
  taxOnDiscounted: boolean
}

export type ReceiptTotals = {
  subtotal: Paise
  discount: Paise
  taxable: Paise
  tax: Paise
  total: Paise
}

export function receiptTotals(
  lines: readonly ReceiptLine[],
  { discount, taxRatePct, taxOnDiscounted }: ReceiptOptions,
): ReceiptTotals {
  requireNonNegative(discount, 'Discount')
  requireNonNegative(taxRatePct, 'Tax rate')
  let subtotal = 0
  for (const { unitPrice, quantity } of lines) {
    requireNonNegative(unitPrice, 'Unit price')
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new RangeError('Quantity must be a non-negative integer')
    }
    subtotal += unitPrice * quantity
  }
  const applied = Math.min(discount, subtotal)
  const taxable = subtotal - applied
  const tax = roundPaise(((taxOnDiscounted ? taxable : subtotal) * taxRatePct) / 100)
  return {
    subtotal: subtotal as Paise,
    discount: applied as Paise,
    taxable: taxable as Paise,
    tax,
    total: (taxable + tax) as Paise,
  }
}

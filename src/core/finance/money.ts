export type Paise = number & { readonly __brand: 'Paise' }

export function rupees(amount: number): Paise {
  if (!Number.isFinite(amount)) throw new RangeError('Rupees must be finite')
  const [whole, fraction = ''] = Math.abs(amount).toString().toLowerCase().split('e')
  const exponent = Number(fraction)
  const [units, decimals = ''] = whole.split('.')
  const digits = BigInt(units + decimals)
  const scale = decimals.length - exponent - 2
  const rounded =
    scale <= 0
      ? digits * 10n ** BigInt(-scale)
      : digits / 10n ** BigInt(scale) +
        ((digits % 10n ** BigInt(scale)) * 2n >= 10n ** BigInt(scale) ? 1n : 0n)
  const paise = Number(rounded) * Math.sign(amount)
  if (!Number.isSafeInteger(paise)) throw new RangeError('Amount exceeds safe integer paise')
  return paise as Paise
}

export function toRupees(amount: Paise): number {
  return amount / 100
}

export function formatINR(amount: Paise, locale: string): string {
  const indianLocale = `${locale.split('-')[0]}-IN`
  return new Intl.NumberFormat(indianLocale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toRupees(amount))
}

export function roundPaise(amount: number): Paise {
  if (!Number.isFinite(amount)) throw new RangeError('Amount must be finite')
  const rounded = Math.sign(amount) * Math.floor(Math.abs(amount) + 0.5)
  if (!Number.isSafeInteger(rounded)) throw new RangeError('Amount exceeds safe integer paise')
  return rounded as Paise
}

export function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`)
  }
}

export function requireNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be non-negative`)
}

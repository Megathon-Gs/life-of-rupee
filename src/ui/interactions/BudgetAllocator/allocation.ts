import type { Paise } from '@/core/finance/money'

export type Jar = 'needs' | 'wants' | 'savings'
export const JARS: readonly Jar[] = ['needs', 'wants', 'savings']

export type Allocation = Record<Jar, number>

/** Fixed step for buttons, keyboard and one drag drop: ₹500 in paise. */
export const STEP_PAISE = 50_000

/** Money not yet placed in a jar; never negative. */
export const remaining = (available: number, a: Allocation) =>
  Math.max(0, available - a.needs - a.wants - a.savings)

/** Start with the recurring commitment (e.g. an EMI) already in needs. */
export function initialAllocation(available: number, commitment = 0): Allocation {
  return { needs: Math.min(commitment, available), wants: 0, savings: 0 }
}

/** Move one fixed step from the unallocated pool into a jar, capped by what is left. */
export function addToJar(
  available: number,
  a: Allocation,
  jar: Jar,
  step = STEP_PAISE,
): Allocation {
  const amount = Math.min(step, remaining(available, a))
  return amount > 0 ? { ...a, [jar]: a[jar] + amount } : a
}

/** Return one step to the pool; needs can never drop below the locked commitment. */
export function removeFromJar(
  a: Allocation,
  jar: Jar,
  commitment = 0,
  step = STEP_PAISE,
): Allocation {
  const floor = jar === 'needs' ? commitment : 0
  const amount = Math.min(step, Math.max(0, a[jar] - floor))
  return amount > 0 ? { ...a, [jar]: a[jar] - amount } : a
}

export type Verdict = 'ok' | 'noEssentials' | 'noSavings' | 'unallocated'

/** What a plan teaches: essentials first, then savings, then every rupee placed. */
export function judge(available: number, a: Allocation, requiredNeeds: number): Verdict {
  if (a.needs < requiredNeeds) return 'noEssentials'
  if (a.savings <= 0) return 'noSavings'
  if (remaining(available, a) > 0) return 'unallocated'
  return 'ok'
}

export const asPaise = (n: number) => n as Paise

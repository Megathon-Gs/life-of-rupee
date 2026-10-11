import { describe, expect, it } from 'vitest'
import { FormFillerConfigSchema, TimeSliderConfigSchema } from '@/core/contracts'
import { compound } from '@/core/finance/interest'
import { rupees, type Paise } from '@/core/finance/money'
import { errorCategories, score } from '@/core/scoring'
import { i18n } from '@/i18n'
import { level } from './level'
import { sources } from './sources'
import en from '../../locales/en/l03.json'
import te from '../../locales/te/l03.json'

const errorDefs = Object.values(errorCategories).filter(def => def.code.startsWith('saving.'))
const step = <T extends (typeof level.steps)[number]['type']>(type: T) =>
  level.steps.find(candidate => candidate.type === type) as Extract<(typeof level.steps)[number], { type: T }>
const rubric = step('decision').rubric
const decisionCorrect = { kind: 'choice' as const, stepId: 'decision', correct: true }
const transferCorrect = { kind: 'choice' as const, stepId: 'transfer', correct: true }

const lesson = TimeSliderConfigSchema.parse(step('lesson').config)
const decision = TimeSliderConfigSchema.parse(step('decision').config)
const variants = step('transfer').variants

// Fictional assumptions that are also written in the English text.
const GOAL = rupees(11_000)
const SAVINGS_PCT = 2
const FD_PCT = 6
const YEARS = 2
const principal = decision.initialAmountPaise as Paise
const yearly = (pct: number, years: number) => compound(principal, pct, 1, years)
const inr = (paise: number) => paise / 100

const amountsIn = (text: string) =>
  [...text.matchAll(/₹([\d,]+(?:\.\d{2})?)/g)].map(match => Number(match[1]!.replaceAll(',', '')))

describe('Level 3 scoring', () => {
  it('scores a clean path at 3 stars and the scripted mistake at 2', () => {
    const wrong = decision.choices!.find(choice => choice.id === 'fd5')!
    const mistake = { kind: 'choice' as const, stepId: 'decision', correct: false, error: decision.error, severity: wrong.severity ?? 'major' as const }
    expect(score({ events: [decisionCorrect, transferCorrect], rubric, errorDefs }).stars).toBe(3)
    const result = score({ events: [mistake, decisionCorrect, transferCorrect], rubric, errorDefs })
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([{ error: 'saving.ignored_liquidity', skillNode: level.skillNodes[0] }])
  })

  it('registers the error category with the scoring registry and review text in both languages', () => {
    expect(errorCategories['saving.ignored_liquidity']).toMatchObject({ severity: 'major', skillNode: 'money.saving' })
    for (const lng of ['en', 'te']) {
      expect(i18n.exists('saving.ignored_liquidity.review', { lng, ns: 'l03', fallbackLng: false })).toBe(true)
    }
    const configs = [lesson, decision, ...variants.map(variant => variant.config)] as { error?: string; fields?: { error?: string }[] }[]
    const used = new Set(configs.flatMap(config => [config.error, ...(config.fields ?? []).map(field => field.error)]).filter(Boolean))
    expect([...used]).toEqual(['saving.ignored_liquidity'])
  })

  it('keeps every wrong decision choice recoverable and the date-fitting deposit as the one answer', () => {
    expect(decision.choices!.map(choice => choice.id).sort()).toEqual(['fd2', 'fd5', 'rd', 'savings'])
    expect(decision.correctChoiceId).toBe('fd2')
    const mistake = { kind: 'choice' as const, stepId: 'decision', correct: false, error: decision.error, severity: 'major' as const }
    expect(score({ events: [mistake, mistake, decisionCorrect, transferCorrect], rubric, errorDefs }).stars).toBeLessThan(3)
  })
})

describe('Level 3 numbers', () => {
  it('only the 2-year fixed deposit has the goal on the date; the others miss it', () => {
    const fd2 = yearly(FD_PCT, YEARS)
    const savings = yearly(SAVINGS_PCT, YEARS)
    const fd5 = yearly(FD_PCT, 5)
    expect(fd2).toBeGreaterThanOrEqual(GOAL)
    expect(savings).toBeLessThan(GOAL)
    expect(fd5).toBeGreaterThan(fd2)
    expect(decision.annualRatePct).toBe(FD_PCT)
    expect(decision.maxYears).toBeGreaterThanOrEqual(5)
  })

  it('decision options and consequence amounts equal the finance output', () => {
    const fd2 = yearly(FD_PCT, YEARS)
    const savings = yearly(SAVINGS_PCT, YEARS)
    const fd5 = yearly(FD_PCT, 5)
    expect(amountsIn(en.decision.savings)).toContain(inr(savings))
    expect(amountsIn(en.decision.fd2)).toContain(inr(fd2))
    expect(amountsIn(en.decision.fd5)).toContain(inr(fd5))
    // Closed early at year 2, the 5-year deposit pays only the savings rate, so it equals the savings figure.
    expect(amountsIn(en.decision.fd5)).toContain(inr(savings))
    expect(amountsIn(te.decision.fd5)).toContain(inr(savings))
    expect(savings).toBeLessThan(GOAL)
    expect(en.decision.prompt).toContain('2% a year')
    const allowed = new Set([
      inr(fd2), inr(GOAL), inr(fd2 - GOAL), inr(savings), inr(GOAL - savings), inr(fd5),
    ])
    for (const text of [en.consequence.matured, en.consequence.compare, te.consequence.matured, te.consequence.compare]) {
      expect(amountsIn(text).length).toBeGreaterThan(0)
      for (const amount of amountsIn(text)) expect(allowed.has(amount), `₹${amount}`).toBe(true)
    }
    const shown = amountsIn([en.consequence.matured, en.consequence.compare].join(' '))
    expect(shown).toEqual(expect.arrayContaining([11_236, 11_000, 236, 10_404, 596, 13_382.26]))
  })

  it('lesson compounding figures match the finance output for yearly, quarterly and monthly', () => {
    const base = lesson.initialAmountPaise as Paise
    const figures = [1, 4, 12].map(periods => inr(compound(base, lesson.annualRatePct!, periods, 2)))
    expect(figures).toEqual([10_816, 10_828.57, 10_831.43])
    expect(figures[0]).toBeLessThan(figures[1]!)
    expect(figures[1]).toBeLessThan(figures[2]!)
    for (const figure of figures) expect(amountsIn(en.lesson.prompt)).toContain(figure)
    for (const figure of figures) expect(amountsIn(te.lesson.prompt)).toContain(figure)
  })

  it('transfer variants are liquid-correct, with different goals, timelines and assumptions', () => {
    expect(variants).toHaveLength(2)
    const kabir = FormFillerConfigSchema.parse(variants[0]!.config)
    const asha = TimeSliderConfigSchema.parse(variants[1]!.config)
    expect(kabir.fields[0]!.correctOptionId).toBe('savings')
    expect(asha.correctChoiceId).toBe('savings')
    expect(kabir.fields[0]!.options.findIndex(option => option.id === 'savings')).toBe(1)
    expect(asha.choices!.findIndex(choice => choice.id === 'savings')).toBe(0)
    expect(asha.annualRatePct).toBe(2.5)
    expect(inr(compound(asha.initialAmountPaise as Paise, asha.annualRatePct!, 1, 1))).toBe(5_125)
    expect(asha.maxYears).toBe(1)
    const wrongErrors = [kabir.fields[0]!.error, asha.error]
    variants.forEach((variant, index) => {
      const mistake = { kind: 'choice' as const, stepId: 'transfer', correct: false, error: wrongErrors[index] }
      const result = score({ events: [mistake, decisionCorrect, transferCorrect], rubric, errorDefs })
      expect(result.stars, variant.id).toBe(2)
      expect(result.reviewItems, variant.id).toMatchObject([{ error: 'saving.ignored_liquidity' }])
    })
  })
})

describe('Level 3 content', () => {
  it('resolves every player-facing key in English and Telugu', () => {
    const check = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te']) expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) value.forEach(item => check(item, property))
      else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => check(item, key))
    }
    check(level)
  })

  it('has a Telugu entry for every English key', () => {
    const keys = (value: unknown, prefix = ''): string[] =>
      value && typeof value === 'object'
        ? Object.entries(value).flatMap(([key, item]) => keys(item, prefix ? `${prefix}.${key}` : key))
        : [prefix]
    expect(keys(te).sort()).toEqual(keys(en).sort())
  })

  it('marks the Telugu draft needsReview', () => {
    expect(te._meta.translationStatus).toContain('needsReview')
  })

  it('backs every claim with a read official source and a review stamp', () => {
    const ids = new Set(sources.map(source => source.id as string))
    expect(level.claims.length).toBeGreaterThan(0)
    for (const claim of level.claims) {
      expect(claim.sourceIds.length).toBeGreaterThan(0)
      for (const id of claim.sourceIds) expect(ids.has(id), id).toBe(true)
      expect(claim.reviewerRole).toContain('sign-off pending')
      expect(i18n.exists(claim.textKey, { lng: 'en', fallbackLng: false })).toBe(true)
    }
    for (const source of sources) expect(source.url).toMatch(/^https:\/\/ncfe\.org\.in\//)
  })

  it('labels every rate as an assumption and sets the savings goal flag', () => {
    expect(en.decision.prompt).toMatch(/fictional assumptions/)
    expect(en.transfer.kabir.title).toMatch(/Fictional assumptions/)
    expect(en.transfer.asha.title).toMatch(/Fictional assumptions/)
    expect(en.lesson.prompt).toMatch(/fictional/)
    expect(level.worldEffects).toEqual([{ key: 'savings.goalMet', value: 'true' }])
    expect(level.id).toBe('l03-saving')
  })

  it('contains no real-looking phone, UPI, Aadhaar, PAN or IFSC strings', () => {
    const serialized = JSON.stringify([level, en, te])
    expect(serialized).not.toMatch(/(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/)
    expect(serialized).not.toMatch(/[\w.-]+@[a-z]{2,}/i)
    expect(serialized).not.toMatch(/\b\d{4}\s?\d{4}\s?\d{4}\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{4}0[A-Z0-9]{6}\b/)
  })
})

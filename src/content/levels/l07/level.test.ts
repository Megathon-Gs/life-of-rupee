import { describe, expect, it } from 'vitest'
import { LevelDefSchema, TimeSliderConfigSchema } from '@/core/contracts'
import { priceAfter } from '@/core/finance/inflation'
import { compound } from '@/core/finance/interest'
import { rupees, type Paise } from '@/core/finance/money'
import { errorCategories, score } from '@/core/scoring'
import { i18n } from '@/i18n'
import en from '../../locales/en/l07.json'
import te from '../../locales/te/l07.json'
import { level } from './level'
import { sources } from './sources'

const rubric = level.steps[3].rubric
const decision = TimeSliderConfigSchema.parse(level.steps[3].config)
const transfers = level.steps[5].variants.map(variant => TimeSliderConfigSchema.parse(variant.config))
const correctDecision = { kind: 'choice' as const, stepId: 'decision', correct: true }
const correctTransfer = { kind: 'choice' as const, stepId: 'transfer', correct: true }
const strings = (value: unknown): string[] => typeof value === 'string'
  ? [value]
  : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : []

describe('Level 7 inflation content', () => {
  it('keeps the six-step market journey and validates every interaction config', () => {
    expect(LevelDefSchema.safeParse(level).success).toBe(true)
    expect(level.id).toBe('l07-inflation')
    expect(level.location).toBe('market')
    expect(level.steps[2].location).toBe('market')
    expect(level.steps[0].lineKeys.length).toBeLessThanOrEqual(3)
    expect(level.steps[1].interaction).toBe('timeSlider')
    expect(level.steps[3].interaction).toBe('timeSlider')
    for (const config of [TimeSliderConfigSchema.parse(level.steps[1].config), decision, ...transfers]) {
      expect(config.annualRatePct).toBeUndefined() // Keep prices in basket mode, not an outcome range.
      expect(config.annualInflationPct).toBeGreaterThan(0)
      expect(config.choices!.filter(choice => choice.id === config.correctChoiceId)).toHaveLength(1)
      for (const choice of config.choices!.filter(choice => choice.id !== config.correctChoiceId)) {
        expect(choice).toMatchObject({ error: 'inflation.nominal_vs_real', severity: 'major' })
      }
    }
  })

  it('scores clean paths at 3 stars and the scripted nominal-balance mistake at 2', () => {
    const wrong = decision.choices!.find(choice => choice.id === 'more')!
    const result = score([
      { kind: 'choice', stepId: 'decision', correct: false, error: wrong.error!, severity: wrong.severity! },
      { kind: 'explanationOpened', stepId: 'decision' },
      correctDecision, correctTransfer,
    ], rubric)
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([{
      error: decision.error, reviewKey: errorCategories[decision.error]!.reviewKey,
      skillNode: level.skillNodes[0],
    }])
    expect(score([correctDecision, correctTransfer], rubric).stars).toBe(3)
    expect(score([correctTransfer], rubric).stars).toBe(0)
    for (const config of transfers) {
      expect(score([
        correctDecision,
        { kind: 'choice', stepId: 'transfer', correct: false, error: config.error, severity: 'major' },
        correctTransfer,
      ], rubric).stars).toBe(2)
    }
    for (const lng of ['en', 'te']) {
      expect(i18n.exists(result.reviewItems[0]!.reviewKey, { lng, ns: 'l07', fallbackLng: false })).toBe(true)
    }
    for (const label of ['Your choice:', 'Safer choice:', 'Concept:', 'Why it matters:']) {
      expect(en.inflation.nominal_vs_real.review).toContain(label)
    }
  })

  it('matches every consequence number in both languages to core finance and the decision config', () => {
    const initial = decision.initialAmountPaise as Paise
    const price = priceAfter(initial, decision.annualInflationPct!, decision.maxYears)
    const savings = compound(initial, 4, 1, decision.maxYears)
    const amounts = (text: string) => [...text.matchAll(/₹([\d,]+(?:\.\d+)?)/g)]
      .map(match => rupees(Number(match[1]!.replaceAll(',', ''))))
    for (const locale of [en, te]) {
      expect(amounts(locale.consequence.basket)).toEqual([initial, price])
      expect(amounts(locale.consequence.savings)).toEqual([initial, savings])
      expect(amounts(locale.consequence.gap)).toEqual([price - savings])
      expect(amounts(locale.consequence.explanation)).toEqual([])
      expect(locale.consequence.basket.match(/\d+(?:\.\d+)?%/g)).toEqual([`${decision.annualInflationPct}%`])
      expect(locale.consequence.savings.match(/\d+(?:\.\d+)?%/g)).toEqual(['4%'])
      expect(locale.consequence.basket.match(/(?<![₹\d,.])\b\d+\b(?![\d,.%])/g)).toEqual([String(decision.maxYears)])
    }
    expect(savings).toBeGreaterThan(initial)
    expect(savings).toBeLessThan(price)
  })

  it('transfers purchasing power to different baskets and rates, including an opposite answer', () => {
    expect(transfers).toHaveLength(2)
    const balances = [rupees(600), compound(rupees(800), 10, 1, 2)]
    expect(transfers.map(config => config.correctChoiceId)).toEqual(['less', 'more'])
    for (const [index, config] of transfers.entries()) {
      expect(config.initialAmountPaise).not.toBe(decision.initialAmountPaise)
      expect(config.annualInflationPct).not.toBe(decision.annualInflationPct)
      const price = priceAfter(config.initialAmountPaise as Paise, config.annualInflationPct!, config.maxYears)
      expect(balances[index]! < price ? 'less' : 'more').toBe(config.correctChoiceId)
      expect(level.steps[5].variants[index]!.interaction).toBe('timeSlider')
    }
    expect(en.transfer.school.prompt).toContain('notebooks, pencils and paper')
    expect(en.transfer.cleaning.prompt).toContain('soap and cleaning cloths')
  })

  it('resolves every text key, labels every rate, and marks the Telugu draft for review', () => {
    const visit = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te']) expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) {
        for (const item of value) visit(item, property)
      } else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) visit(item, key)
      }
    }
    visit(level)
    expect(te._meta.needsReview).toBe(true)
    for (const [locale, label] of [[en, 'Assumption:'], [te, 'అంచనా:']] as const) {
      for (const text of strings(locale)) {
        for (const sentence of text.split(/(?<=[.!?])\s+/)) {
          if (sentence.includes('%')) expect(sentence).toContain(label)
        }
      }
    }
  })

  it('backs claims with local official sources without pretending educator approval', () => {
    for (const claim of level.claims) {
      expect(claim.sourceIds.length).toBeGreaterThan(0)
      for (const sourceId of claim.sourceIds) expect(sources.some(source => source.id === sourceId)).toBe(true)
      expect(claim.reviewedOn).toBe('2026-10-11')
    }
    expect(sources.map(source => new URL(source.url).hostname).sort()).toEqual(['ncfe.org.in', 'www.rbi.org.in'])
    for (const claim of level.claims) expect(claim.reviewerRole).toContain('sign-off pending')
    for (const key of ['hook.3', 'consequence.explanation', 'inflation.nominal_vs_real.review']) {
      expect(level.claims.some(claim => claim.textKey === `l07:${key}`)).toBe(true)
    }
  })

  it('contains no phone, UPI, Aadhaar, PAN or IFSC-looking identifiers', () => {
    const serialized = JSON.stringify([level, sources, en, te])
    expect(serialized).not.toMatch(/\b(?:\+?91[ -]?)?[6-9]\d{9}\b/)
    expect(serialized).not.toMatch(/[\w.+-]+@[\w.-]+/)
    expect(serialized).not.toMatch(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{5}\d{4}[A-Z]\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{4}0[A-Z\d]{6}\b/)
  })
})

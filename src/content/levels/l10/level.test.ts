import { describe, expect, it } from 'vitest'
import { DocumentInspectorConfigSchema, FormFillerConfigSchema } from '@/core/contracts'
import { claimOutcome, type Policy } from '@/core/finance/insurance'
import { loanTotals } from '@/core/finance/emi'
import { rupees } from '@/core/finance/money'
import { errorCategories, score } from '@/core/scoring'
import { i18n } from '@/i18n'
import { level } from './level'
import en from '../../locales/en/l10.json'
import te from '../../locales/te/l10.json'

const errorDefs = Object.values(errorCategories).filter(def => def.code.startsWith('insurance.'))
const rubric = level.steps[3].rubric
const decisionCorrect = { kind: 'choice' as const, stepId: 'decision', correct: true }
const transferCorrect = { kind: 'choice' as const, stepId: 'transfer', correct: true }

const fuller: Policy = { covered: ['accident', 'theft'], exclusions: ['maintenance', 'flood'], deductible: rupees(1_000), cap: rupees(40_000) }
const basic: Policy = { covered: ['accident', 'theft'], exclusions: ['maintenance', 'flood'], deductible: rupees(5_000), cap: rupees(20_000) }
const accident = { kind: 'accident', loss: rupees(18_000) }

describe('Level 10 scoring', () => {
  it('scores a clean path at 3 stars and the scripted mistake at 2', () => {
    const decision = DocumentInspectorConfigSchema.parse(level.steps[3].config)
    const wrong = decision.fields.find(field => field.error === 'insurance.ignored_deductible')!
    const mistake = { kind: 'choice' as const, stepId: 'decision', correct: false, error: wrong.error }
    expect(score({ events: [decisionCorrect, transferCorrect], rubric, errorDefs }).stars).toBe(3)
    const result = score({ events: [mistake, decisionCorrect, transferCorrect], rubric, errorDefs })
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([{ error: 'insurance.ignored_deductible', skillNode: level.skillNodes[0] }])
  })

  it('has review text in both languages for every registered error', () => {
    for (const def of errorDefs) for (const lng of ['en', 'te']) {
      expect(i18n.exists(def.reviewKey, { lng, ns: 'l10', fallbackLng: false })).toBe(true)
    }
    const configs = [
      level.steps[1].config, level.steps[3].config,
      ...level.steps[5].variants.map(variant => variant.config),
    ] as { fields?: { error?: string }[]; offers?: { error?: string }[] }[]
    const used = new Set(configs.flatMap(config => [...(config.fields ?? []), ...(config.offers ?? [])]).map(item => item.error).filter(Boolean))
    expect([...used].sort()).toEqual(errorDefs.map(def => def.code).sort())
  })

  it('transfer variants are excluded incidents where the emergency fund pays', () => {
    expect(level.steps[5].variants).toHaveLength(2)
    expect(claimOutcome(fuller, { kind: 'maintenance', loss: rupees(3_500) })).toMatchObject({ payout: 0, youPay: rupees(3_500), reason: 'excluded' })
    expect(claimOutcome(fuller, { kind: 'flood', loss: rupees(9_000) })).toMatchObject({ payout: 0, youPay: rupees(9_000), reason: 'excluded' })
    const configs = level.steps[5].variants.map(variant => FormFillerConfigSchema.parse(variant.config))
    expect(configs.map(config => config.fields[0]!.correctOptionId)).toEqual(['emergencyFund', 'emergencyFund'])
    expect(configs.map(config => config.fields[0]!.options.findIndex(o => o.id === 'emergencyFund'))).toEqual([1, 0])
    for (const config of configs) {
      const result = score({ events: [{ kind: 'choice', stepId: 'transfer', correct: false, error: config.fields[0]!.error }, decisionCorrect, transferCorrect], rubric, errorDefs })
      expect(result.stars).toBe(2)
    }
  })

  it('lesson policy cards match finance output and the fuller cover is the answer', () => {
    const config = DocumentInspectorConfigSchema.parse(level.steps[1].config)
    const total = (policy: Policy, premium: number) => rupees(premium) + claimOutcome(policy, accident).youPay
    expect(total(basic, 1_200)).toBe(rupees(6_200))
    expect(total(fuller, 2_400)).toBe(rupees(3_400))
    expect(claimOutcome(basic, accident).payout).toBe(rupees(13_000))
    expect(config.documentType).toBe('insurance-policy')
    expect(config.fields.filter(field => field.isAnswer).map(field => field.id)).toEqual(['fuller'])
    for (const text of [en.lesson.basicValue, en.lesson.fullerValue]) {
      for (const match of text.matchAll(/₹([\d,]+)/g)) expect([1_200, 2_400, 5_000, 1_000, 20_000, 40_000, 18_000, 13_000, 17_000, 6_200, 3_400]).toContain(Number(match[1]!.replaceAll(',', '')))
    }
  })
})

describe('Level 10 content', () => {
  it('consequence amounts equal the finance output', () => {
    const outcome = claimOutcome(fuller, accident)
    const premium = loanTotals(rupees(2_400) as never, 0, 12).totalRepaid
    const allowed = new Set([accident.loss, outcome.payout, outcome.youPay, premium, outcome.youPay + premium].map(n => n / 100))
    expect(outcome).toMatchObject({ payout: rupees(17_000), youPay: rupees(1_000), reason: 'covered' })
    const text = [en.consequence.paid, en.consequence.youPay, te.consequence.paid, te.consequence.youPay].join(' ')
    const shown = [...text.matchAll(/₹([\d,]+)/g)].map(match => Number(match[1]!.replaceAll(',', '')))
    expect(shown.length).toBeGreaterThan(0)
    for (const amount of shown) expect(allowed.has(amount), `₹${amount}`).toBe(true)
    expect(shown).toEqual(expect.arrayContaining([17_000, 1_000, 2_400, 3_400]))
  })

  it('resolves every player-facing key in English and Telugu', () => {
    const check = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te']) expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) value.forEach(item => check(item, property))
      else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => check(item, key))
    }
    check(level)
  })

  it('records the approved Telugu translation', () => {
    expect(te._meta.translationStatus).toContain('ఆమోదించబడింది')
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

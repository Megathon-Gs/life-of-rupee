import { describe, expect, it } from 'vitest'
import { DocumentInspectorConfigSchema } from '@/core/contracts'
import { errorCategories, score } from '@/core/scoring'
import { payslip } from '@/core/finance/payslip'
import { i18n } from '@/i18n'
import { level } from './level'
import en from '../../locales/en/l08.json'
import te from '../../locales/te/l08.json'

const rubric = level.steps[3].rubric
const decisionCorrect = { kind: 'choice' as const, stepId: 'decision', correct: true }
const transferCorrect = { kind: 'choice' as const, stepId: 'transfer', correct: true }
const rupees = (n: number) => n * 100
const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`

const lessonSlip = payslip(rupees(18_000) as never, [
  { label: 'retirement', percent: 12 },
  { label: 'tax', amount: rupees(400) as never },
  { label: 'canteen', amount: rupees(500) as never },
])
const devSlip = payslip(rupees(24_000) as never, [
  { label: 'retirement', percent: 8 },
  { label: 'tax', amount: rupees(1_200) as never },
  { label: 'advance', amount: rupees(1_500) as never },
])
const ilaSlip = payslip(rupees(30_000) as never, [
  { label: 'retirement', percent: 10 },
  { label: 'tax', amount: rupees(2_500) as never },
  { label: 'welfare', amount: rupees(500) as never },
])

describe('Level 8', () => {
  it('scores a clean path at 3 stars and the scripted mistake at 2', () => {
    const config = DocumentInspectorConfigSchema.parse(level.steps[3].config)
    const error = config.fields.find(f => f.id === 'gross')!.error
    const mistake = { kind: 'choice' as const, stepId: 'decision', correct: false, error }
    const result = score([mistake, decisionCorrect, transferCorrect], rubric)
    expect(result.stars).toBe(2)
    expect(result.reviewItems[0]!.reviewKey).toBe(errorCategories[error!]!.reviewKey)
    expect(score([decisionCorrect, transferCorrect], rubric).stars).toBe(3)
  })

  it('shows consequence and payslip numbers equal to src/core/finance output', () => {
    expect(en.consequence.net).toContain(fmt(lessonSlip.net))
    expect(en.consequence.deductions).toContain(fmt(lessonSlip.totalDeductions))
    expect(en.consequence.deductions).toContain(fmt(lessonSlip.gross))
    expect([en.decision.netValue, en.lesson.netValue]).toEqual([fmt(lessonSlip.net), fmt(lessonSlip.net)])
    expect([en.decision.deductionsValue, en.lesson.deductionsValue]).toEqual([fmt(lessonSlip.totalDeductions), fmt(lessonSlip.totalDeductions)])
    expect(en.decision.grossValue).toBe(fmt(lessonSlip.gross))
    for (const [text, slip] of [[en.transfer.dev, devSlip], [en.transfer.ila, ilaSlip]] as const) {
      expect(text.netValue).toBe(fmt(slip.net))
      expect(text.grossValue).toBe(fmt(slip.gross))
      expect(text.deductionsValue).toBe(fmt(slip.totalDeductions))
    }
  })

  it('has two transfer variants where net pay is not the largest number', () => {
    const variants = level.steps[5].variants
    expect(variants).toHaveLength(2)
    for (const [variant, text] of [[variants[0]!, en.transfer.dev], [variants[1]!, en.transfer.ila]] as const) {
      const config = DocumentInspectorConfigSchema.parse(variant.config)
      expect(config.fields.filter(f => f.isAnswer).map(f => f.id)).toEqual(['net'])
      const num = (s: string) => Number(s.replace(/[^\d]/g, ''))
      expect(num(text.extraValue)).toBeGreaterThan(num(text.netValue))
      expect(num(text.grossValue)).toBeGreaterThan(num(text.netValue))
    }
  })

  it('resolves every player-facing key and claim in English and Telugu; Telugu is approved', () => {
    const check = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te']) expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) value.forEach(item => check(item, property))
      else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => check(v, k))
    }
    check(level)
    expect(te._meta.translationStatus).toContain('ఆమోదించబడింది')
  })

  it('contains no real-looking phone, UPI, Aadhaar, PAN or IFSC strings', () => {
    const serialized = JSON.stringify([level, en, te])
    expect(serialized).not.toMatch(/\b\d{12}\b/)
    expect(serialized).not.toMatch(/\b[6-9]\d{9}\b/)
    expect(serialized).not.toMatch(/[\w.-]+@[a-z]{2,}/i)
    expect(serialized).not.toMatch(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{4}0[A-Z0-9]{6}\b/)
  })
})

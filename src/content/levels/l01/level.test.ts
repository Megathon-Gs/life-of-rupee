import { describe, expect, it } from 'vitest'
import { BudgetAllocatorConfigSchema, DocumentInspectorConfigSchema, ErrorCategoryDefSchema } from '@/core/contracts'
import { monthsToGoal } from '@/core/finance/goals'
import { formatINR, rupees, type Paise } from '@/core/finance/money'
import { score } from '@/core/scoring'
import { i18n } from '@/i18n'
import { initialAllocation, judge } from '@/ui/interactions/BudgetAllocator/allocation'
import { level } from './level'
import en from '../../locales/en/l01.json'
import te from '../../locales/te/l01.json'

// Local until src/core/scoring registers the budget codes (frozen path for this task).
const errorDefs = [
  { code: 'budget.no_essentials', severity: 'major' },
  { code: 'budget.no_savings', severity: 'minor' },
].map(def => ErrorCategoryDefSchema.parse({ ...def, skillNode: 'money.budgeting', reviewKey: `${def.code}.review` }))

const rubric = level.steps[3].rubric
const decisionCorrect = { kind: 'choice' as const, stepId: 'decision', correct: true }
const transferCorrect = { kind: 'choice' as const, stepId: 'transfer', correct: true }
const decisionConfig = BudgetAllocatorConfigSchema.parse(level.steps[3].config)
const variants = level.steps[5].variants.map(variant => ({ id: variant.id, config: BudgetAllocatorConfigSchema.parse(variant.config) }))

describe('Level 1 scoring', () => {
  it('scores a clean path at 3 stars and the scripted mistake at 2', () => {
    expect(score({ events: [decisionCorrect, transferCorrect], rubric, errorDefs }).stars).toBe(3)
    const mistake = { kind: 'choice' as const, stepId: 'decision', correct: false, error: decisionConfig.errors.noEssentials, severity: 'major' as const }
    const result = score({ events: [mistake, decisionCorrect, transferCorrect], rubric, errorDefs })
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([{ error: 'budget.no_essentials', skillNode: level.skillNodes[0] }])
  })

  it('has review text in both languages for both error categories', () => {
    for (const def of errorDefs) for (const lng of ['en', 'te']) {
      expect(i18n.exists(def.reviewKey, { lng, ns: 'l01', fallbackLng: false })).toBe(true)
    }
    const used = new Set([decisionConfig, ...variants.map(variant => variant.config)].flatMap(config => Object.values(config.errors)))
    expect([...used].sort()).toEqual(errorDefs.map(def => def.code).sort())
  })

  it('teaches the review in four parts', () => {
    for (const text of [en.budget.no_essentials.review, en.budget.no_savings.review]) {
      for (const part of ['Your choice:', 'Safer choice:', 'Concept:', 'Why it matters:']) expect(text).toContain(part)
    }
  })
})

describe('Level 1 plans', () => {
  const plan = (config: typeof decisionConfig, needsExtra: number, wants: number, savings: number) => {
    const commitment = config.recurringCommitmentPaise ?? 0
    const start = initialAllocation(config.availablePaise, commitment)
    const alloc = { needs: start.needs + needsExtra, wants, savings }
    return judge(config.availablePaise, alloc, (config.essentialsPaise ?? 0) + commitment)
  }

  it('the decision has a clean plan and rejects both mistakes', () => {
    expect(plan(decisionConfig, rupees(2_000), rupees(1_000), rupees(1_000))).toBe('ok')
    expect(plan(decisionConfig, rupees(1_500), rupees(2_000), rupees(500))).toBe('noEssentials')
    expect(plan(decisionConfig, rupees(2_000), rupees(2_000), 0)).toBe('noSavings')
  })

  it('transfer variants use different stipends, surprise costs and a revisable plan', () => {
    expect(variants).toHaveLength(2)
    expect(new Set(variants.map(v => v.config.availablePaise)).size).toBe(2)
    expect(variants.map(v => v.config.recurringCommitmentPaise)).toEqual([rupees(1_000), rupees(500)])
    expect(variants.map(v => v.config.availablePaise)).not.toContain(decisionConfig.availablePaise)
    for (const { config } of variants) {
      const left = config.essentialsPaise!
      expect(plan(config, left, config.availablePaise - config.recurringCommitmentPaise! - left - rupees(500), rupees(500))).toBe('ok')
      expect(plan(config, 0, config.availablePaise - config.recurringCommitmentPaise! - rupees(500), rupees(500))).toBe('noEssentials')
      const result = score({ events: [decisionCorrect, { kind: 'choice', stepId: 'transfer', correct: false, error: config.errors.noEssentials }, transferCorrect], rubric, errorDefs })
      expect(result.stars).toBe(2)
      expect(result.capsApplied).toContain('transfer')
    }
  })

  it('the lesson has exactly one need to tap', () => {
    const config = DocumentInspectorConfigSchema.parse(level.steps[1].config)
    expect(config.fields.filter(field => field.isAnswer).map(field => field.id)).toEqual(['busPass'])
  })
})

describe('Level 1 content', () => {
  it('consequence amounts equal the finance output', () => {
    const stipend = decisionConfig.availablePaise as Paise
    const needs = decisionConfig.essentialsPaise as Paise
    const savings = rupees(1_000)
    const wants = (stipend - needs - savings) as Paise
    const target = rupees(6_000)
    const months = monthsToGoal(target, savings, 0)
    expect(months).toBe(6)
    const allowed = new Set([stipend, needs, wants, savings, target].map(n => n / 100))
    const text = [en.consequence.plan, en.consequence.savings, te.consequence.plan, te.consequence.savings].join(' ')
    const shown = [...text.matchAll(/₹([\d,]+)/g)].map(match => Number(match[1]!.replaceAll(',', '')))
    for (const amount of shown) expect(allowed.has(amount), `₹${amount}`).toBe(true)
    expect(shown).toEqual(expect.arrayContaining([4_000, 2_000, 1_000, 6_000]))
    expect(en.consequence.savings).toContain(`${months} months`)
    expect(te.consequence.savings).toContain(`${months} నెలల`)
    expect(en.consequence.savings).toContain('no interest')
    expect(formatINR(needs, 'en')).toBe('₹2,000.00')
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

  it('marks the Telugu draft needsReview', () => {
    expect(te._meta.translationStatus).toContain('needsReview')
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

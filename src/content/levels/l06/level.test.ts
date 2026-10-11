import { describe, expect, it } from 'vitest'
import {
  BudgetAllocatorConfigSchema,
  ReceiptInspectorConfigSchema,
  ScenarioChainConfigSchema,
  type ReceiptInspectorConfig,
} from '@/core/contracts'
import { receiptTotals } from '@/core/finance/receipt'
import { errorCategories, score } from '@/core/scoring'
import { createLevelRunner } from '@/level-runner'
import { judge } from '@/ui/interactions/BudgetAllocator/allocation'
import { i18n } from '@/i18n'
import { level } from './level'
import { sources } from './sources'
import en from '../../locales/en/l06.json'
import te from '../../locales/te/l06.json'

const errorDefs = Object.values(errorCategories).filter(def => /^(receipt|budget)\./.test(def.code))
const rubric = level.steps[3].rubric
const decisionCorrect = { kind: 'choice' as const, stepId: 'decision', correct: true }
const transferCorrect = { kind: 'choice' as const, stepId: 'transfer', correct: true }
const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`
const totalsOf = (config: ReceiptInspectorConfig) =>
  receiptTotals(
    config.items.map(item => ({ unitPrice: item.unitPricePaise as never, quantity: item.quantity ?? 1 })),
    { discount: config.discountPaise as never, taxRatePct: config.taxRatePct, taxOnDiscounted: config.taxOnDiscounted },
  )
const chain = ScenarioChainConfigSchema.parse(level.steps[3].config)
const decision = ReceiptInspectorConfigSchema.parse(chain.links[0]!.config)
const budgetConfig = (config: unknown) => BudgetAllocatorConfigSchema.parse(ScenarioChainConfigSchema.parse(config).links[1]!.config)
const override = level.steps[3].configOverrides![0]!
const transfers = level.steps[5].variants.map(variant => ReceiptInspectorConfigSchema.parse(variant.config))

describe('Level 6', () => {
  it('scores a clean path at 3 stars and the scripted mistake at 2', () => {
    const mistake = { kind: 'choice' as const, stepId: 'decision', correct: false, error: decision.errors.discountBeforeTax, severity: 'major' as const }
    const clean = score({ events: [decisionCorrect, transferCorrect], rubric, errorDefs })
    expect(clean.stars).toBe(3)
    const result = score({ events: [mistake, decisionCorrect, transferCorrect], rubric, errorDefs })
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([{ error: 'receipt.discount_before_tax', skillNode: level.skillNodes[0] }])
  })

  it('shows consequence numbers equal to src/core/finance output', () => {
    const totals = totalsOf(decision)
    expect(en.consequence.tags).toContain(fmt(totals.subtotal))
    expect(en.consequence.total).toContain(fmt(totals.total))
    expect(en.consequence.total).toContain(fmt(totals.discount))
    expect(en.consequence.total).toContain(`${decision.taxRatePct}%`)
    const budget = 41_000
    expect(en.consequence.budget).toContain(fmt(budget))
    expect(en.consequence.budget).toContain(fmt(totals.total - budget))
    for (const key of ['tags', 'total', 'budget'] as const) {
      const digits = (s: string) => s.match(/₹[\d,]+/g)
      expect(digits(te.consequence[key])).toEqual(digits(en.consequence[key]))
    }
  })

  it('budget follow-up: essentials equal the receipt total and a valid plan exists', () => {
    const totals = totalsOf(decision)
    expect(chain.links.map(link => link.interaction)).toEqual(['receiptInspector', 'budgetAllocator'])
    const plain = budgetConfig(chain)
    expect(plain.essentialsPaise).toBe(totals.total)
    expect(plain.recurringCommitmentPaise).toBeUndefined()
    const withEmi = budgetConfig(override.config)
    expect(withEmi.recurringCommitmentPaise).toBe(50_000)
    expect(withEmi.essentialsPaise).toBe(totals.total)
    for (const config of [plain, withEmi]) {
      const required = (config.essentialsPaise ?? 0) + (config.recurringCommitmentPaise ?? 0)
      const needs = Math.ceil(required / 50_000) * 50_000
      const plan = { needs, wants: 0, savings: config.availablePaise - needs }
      expect(judge(config.availablePaise, plan, required)).toBe('ok')
      expect(judge(config.availablePaise, { needs: 0, wants: 0, savings: config.availablePaise }, required)).toBe('noEssentials')
    }
    expect(override.when).toEqual({ flag: 'loan.activeInstallment', equals: 'true' })
  })

  it('shows the fixed installment only when loan.activeInstallment is set', () => {
    const run = (flags: Record<string, string>) => {
      const runner = createLevelRunner({ levels: [level], newId: () => 'a', now: () => '2026-10-11T00:00:00Z' })
      runner.start(level, 1, () => '2026-10-11T00:00:00Z', flags)
      runner.advance(); runner.complete(); runner.arrive(level.location)
      return budgetConfig(runner.current().view!.type === 'decision' ? (runner.current().view as { config: unknown }).config : null)
    }
    expect(run({}).recurringCommitmentPaise).toBeUndefined()
    expect(run({ 'loan.activeInstallment': 'false' }).recurringCommitmentPaise).toBeUndefined()
    expect(run({ 'loan.activeInstallment': 'true' }).recurringCommitmentPaise).toBe(50_000)
  })

  it('makes the tag subtotal differ from the amount to pay on every receipt', () => {
    for (const config of [ReceiptInspectorConfigSchema.parse(level.steps[1].config), decision, ...transfers]) {
      const totals = totalsOf(config)
      expect(totals.total).not.toBe(totals.subtotal)
      expect(config.taxOnDiscounted).toBe(true)
      expect(config.discountPaise).toBeGreaterThan(0)
    }
  })

  it('has two transfer variants with a discount applied before tax', () => {
    expect(transfers).toHaveLength(2)
    for (const config of transfers) {
      const totals = totalsOf(config)
      expect(totals.taxable).toBe(totals.subtotal - totals.discount)
      expect(totals.tax).toBe(Math.round((totals.taxable * config.taxRatePct) / 100))
    }
    expect(new Set(transfers.map(config => config.taxRatePct)).size).toBe(2)
  })

  it('labels every tax rate as an assumption', () => {
    const prompts = [en.lesson.prompt, en.decision.prompt, en.transfer.stationery.prompt, en.transfer.grocery.prompt, en.consequence.total]
    for (const text of prompts) expect(text).toMatch(/assum/i)
  })

  it('uses real sources for every claim and a review stamp', () => {
    const ids = new Set(sources.map(source => source.id as string))
    expect(level.claims.length).toBeGreaterThanOrEqual(5)
    for (const claim of level.claims) {
      expect(claim.sourceIds.every(id => ids.has(id))).toBe(true)
      expect(claim.reviewerRole).toContain('NGO educator')
    }
    for (const source of sources) expect(source.url).toMatch(/^https:\/\/(taxinformation\.cbic\.gov\.in|ncfe\.org\.in)\//)
  })

  it('resolves every player-facing key and claim in English and Telugu; Telugu is needsReview', () => {
    const check = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te']) expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) value.forEach(item => check(item, property))
      else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => check(v, k))
    }
    check(level)
    for (const claim of level.claims) {
      for (const lng of ['en', 'te']) expect(i18n.exists(claim.textKey, { lng, fallbackLng: false }), claim.textKey).toBe(true)
    }
    for (const def of errorDefs) {
      for (const lng of ['en', 'te']) expect(i18n.exists(`l06:${def.reviewKey}`, { lng, fallbackLng: false }), def.reviewKey).toBe(true)
    }
    expect(te._meta.translationStatus).toContain('needsReview')
  })

  it('uses the market location and the l06-receipts id without registering elsewhere', () => {
    expect(level.id).toBe('l06-receipts')
    expect(level.location).toBe('market')
    expect(level.steps[2]).toMatchObject({ type: 'travel', location: 'market' })
    expect(level.steps[0].lineKeys.length).toBeLessThanOrEqual(3)
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

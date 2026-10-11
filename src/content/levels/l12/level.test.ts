import { describe, expect, it } from 'vitest'
import {
  BudgetAllocatorConfigSchema,
  MessageTriageConfigSchema,
  OfferComparatorConfigSchema,
  ScenarioChainConfigSchema,
  TimeSliderConfigSchema,
  UpiPaymentConfigSchema,
  type InteractionEvent,
  type ScenarioChainConfig,
} from '@/core/contracts'
import { loanTotals } from '@/core/finance/emi'
import { compound } from '@/core/finance/interest'
import type { Paise } from '@/core/finance/money'
import { errorCategories, score } from '@/core/scoring'
import { i18n } from '@/i18n'
import en from '../../locales/en/l12.json'
import te from '../../locales/te/l12.json'
import { level } from './level'
import { sources } from './sources'

const rubric = level.steps[3].rubric
const correct = (stepId: string): InteractionEvent => ({ kind: 'choice', stepId, correct: true })
const wrong = (
  stepId: string,
  error: string,
  severity: 'critical' | 'major' | 'minor',
): InteractionEvent => ({ kind: 'choice', stepId, correct: false, error, severity })

const decisionChain = ScenarioChainConfigSchema.parse(level.steps[3].config)
const transferChains = level.steps[5].variants.map((variant) =>
  ScenarioChainConfigSchema.parse(variant.config),
)

const textKeys = (value: object, prefix = ''): string[] =>
  Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof item === 'string' ? [path] : textKeys(item as object, path)
  })

const linkConfig = <T>(
  chain: ScenarioChainConfig,
  interaction: string,
  schema: { parse: (v: unknown) => T },
): T => schema.parse(chain.links.find((link) => link.interaction === interaction)!.config)

const usedErrorCodes = (chain: ScenarioChainConfig): string[] =>
  chain.links.flatMap((link) => {
    switch (link.interaction) {
      case 'budgetAllocator': {
        const config = BudgetAllocatorConfigSchema.parse(link.config)
        return [config.errors.noEssentials, config.errors.noSavings]
      }
      case 'upiPayment': {
        const config = UpiPaymentConfigSchema.parse(link.config)
        return config.choices.filter((c) => c.id !== config.correctChoiceId).map((c) => c.error!)
      }
      case 'offerComparator': {
        const config = OfferComparatorConfigSchema.parse(link.config)
        return config.offers.filter((offer) => offer.error).map((offer) => offer.error!)
      }
      case 'timeSlider': {
        const config = TimeSliderConfigSchema.parse(link.config)
        return config.choices!.filter((c) => c.id !== config.correctChoiceId).map((c) => c.error!)
      }
      case 'messageTriage':
        return MessageTriageConfigSchema.parse(link.config).messages.map((m) => m.error)
      default:
        return []
    }
  })

describe('Level 12 shape, text and claims', () => {
  it('validates its local sources, claims, configs and bilingual strings without registration', () => {
    expect(textKeys(en).sort()).toEqual(textKeys(te).sort())
    const sourceIds = new Set(sources.map((source) => source.id))
    for (const claim of level.claims) {
      expect(claim.sourceIds.length).toBeGreaterThan(0)
      for (const id of claim.sourceIds) expect(sourceIds.has(id), id).toBe(true)
      expect(claim.reviewerRole).toContain('sign-off pending')
    }
    const check = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te'])
          expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) value.forEach((item) => check(item, property))
      else if (value && typeof value === 'object')
        Object.entries(value).forEach(([key, item]) => check(item, key))
    }
    check(level)
    expect(level.id).toBe('l12-capstone')
    expect(level.skillNodes).toEqual(['money.independence'])
    expect(level.location).toBe('home')
    expect(level.steps.map((step) => step.type)).toEqual([
      'hook',
      'lesson',
      'travel',
      'decision',
      'consequence',
      'transfer',
    ])
    expect(level.steps[2].location).toBe('home')
    expect(level.worldEffects).toEqual([{ key: 'curriculum.completed', value: 'true' }])
    expect(te._meta.translationStatus).toContain('needsReview')
  })

  it('links budget, a UPI check, a borrowing choice and a savings decision in one chain', () => {
    expect(level.steps[3].interaction).toBe('scenarioChain')
    expect(decisionChain.links.map((link) => link.interaction)).toEqual([
      'budgetAllocator',
      'upiPayment',
      'offerComparator',
      'timeSlider',
    ])
    const upi = linkConfig(decisionChain, 'upiPayment', UpiPaymentConfigSchema)
    const loan = linkConfig(decisionChain, 'offerComparator', OfferComparatorConfigSchema)
    const savings = linkConfig(decisionChain, 'timeSlider', TimeSliderConfigSchema)
    expect(upi.correctChoiceId).toBe('decline')
    expect(loan.correctOfferId).toBe('twelve-months')
    expect(savings.correctChoiceId).toBe('assumption')
    // The longer loan is cheaper per month but costs more overall: the scripted mistake.
    const long = loan.offers.find((offer) => offer.id === 'thirty-six-months')!
    expect(long).toMatchObject({ error: 'loan.ignored_total_cost', severity: 'major' })
  })

  it('puts a fraud attempt in the middle of each transfer month with at least two variants', () => {
    expect(level.steps[5].variants.length).toBeGreaterThanOrEqual(2)
    for (const variant of level.steps[5].variants) expect(variant.interaction).toBe('scenarioChain')
    for (const chain of transferChains) {
      expect(chain.links.length).toBeGreaterThanOrEqual(3)
      const fraudIndex = chain.links.findIndex((link) => link.interaction === 'messageTriage')
      expect(fraudIndex).toBeGreaterThan(0)
      expect(fraudIndex).toBeLessThan(chain.links.length - 1)
      const links = chain.links.map((link) => link.interaction)
      expect(links).toContain('budgetAllocator')
      expect(links).toContain('offerComparator')
      expect(links).toContain('timeSlider')
      const triage = linkConfig(chain, 'messageTriage', MessageTriageConfigSchema)
      expect(triage.messages[0]!.correctClassification).toBe('fraud')
      expect(triage.messages[0]!.requiredWarningSignIds.length).toBeGreaterThan(0)
    }
  })

  it('registers every used error code with review text in both languages', () => {
    const codes = new Set([
      ...usedErrorCodes(decisionChain),
      ...transferChains.flatMap(usedErrorCodes),
    ])
    expect(codes.size).toBeGreaterThan(0)
    for (const code of codes) {
      expect(errorCategories[code], code).toBeDefined()
      for (const lng of ['en', 'te']) {
        expect(i18n.exists(`${code}.review`, { lng, ns: 'l12', fallbackLng: false }), code).toBe(
          true,
        )
      }
      const review = i18n.t(`${code}.review`, { lng: 'en', ns: 'l12' })
      for (const label of ['Your choice:', 'Safer choice:', 'Concept:', 'Why it matters:'])
        expect(review, code).toContain(label)
    }
  })
})

describe('Level 12 scoring', () => {
  it('scores a clean path at 3 stars and the scripted long-loan mistake at 2', () => {
    expect(score([correct('decision'), correct('transfer')], rubric).stars).toBe(3)
    const result = score(
      [
        wrong('decision', 'loan.ignored_total_cost', 'major'),
        correct('decision'),
        correct('transfer'),
      ],
      rubric,
    )
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([
      {
        error: 'loan.ignored_total_cost',
        reviewKey: 'loan.ignored_total_cost.review',
        skillNode: 'borrowing.emi',
      },
    ])
  })

  it('caps a wrong first transfer answer at 2 and a critical safety error at 1', () => {
    const transferWrong = score(
      [correct('decision'), wrong('transfer', 'fraud.clicked_link', 'major'), correct('transfer')],
      rubric,
    )
    expect(transferWrong.stars).toBe(2)
    expect(transferWrong.capsApplied).toContain('transfer')
    const critical = score(
      [correct('decision'), wrong('transfer', 'fraud.shared_otp', 'critical'), correct('transfer')],
      rubric,
    )
    expect(critical.stars).toBe(1)
    expect(critical.capsApplied).toContain('critical')
  })
})

describe('Level 12 consequence numbers', () => {
  it('equals the finance output for the decision chain config, in both languages', () => {
    const budget = linkConfig(decisionChain, 'budgetAllocator', BudgetAllocatorConfigSchema)
    const loan = linkConfig(decisionChain, 'offerComparator', OfferComparatorConfigSchema)
    const savings = linkConfig(decisionChain, 'timeSlider', TimeSliderConfigSchema)
    const offer = loan.offers.find((item) => item.id === loan.correctOfferId)!
    const totals = loanTotals(
      offer.principalPaise as Paise,
      offer.annualRatePct,
      offer.tenureMonths,
      offer.feesPaise as Paise,
    )
    const lowRate = Math.max(0, savings.annualRatePct! - savings.rangeSpreadPct!)
    const highRate = savings.annualRatePct! + savings.rangeSpreadPct!
    const amounts = [
      budget.availablePaise,
      budget.essentialsPaise! + budget.recurringCommitmentPaise!,
      budget.recurringCommitmentPaise!,
      totals.emi,
      totals.totalRepaid,
      savings.initialAmountPaise,
      compound(savings.initialAmountPaise as Paise, lowRate, 1, savings.maxYears),
      compound(savings.initialAmountPaise as Paise, highRate, 1, savings.maxYears),
    ].map((paise) => paise / 100)

    for (const locale of [en, te]) {
      const text = locale.consequence.month
      const shown = [...text.matchAll(/₹(\d+(?:,\d{2,3})*(?:\.\d+)?)/g)].map((match) =>
        Number(match[1]!.replaceAll(',', '')),
      )
      expect(new Set(shown)).toEqual(new Set(amounts))
      expect([...text.matchAll(/(\d+)%/g)].map((match) => Number(match[1]))).toEqual([
        lowRate,
        highRate,
      ])
      expect(text).toContain('Assumption')
      expect(locale.consequence.next).not.toMatch(/₹|\d+%/)
      expect(locale.consequence.explanation).not.toMatch(/₹|\d+%/)
    }
  })
})

describe('Level 12 content safety', () => {
  it('contains no real-looking financial identities, phones or provider handles', () => {
    const text = JSON.stringify([level, sources, en, te])
    expect(text).not.toMatch(/(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/)
    expect(text).not.toMatch(/[\w.-]+@[a-z]{2,}/i)
    expect(text).not.toMatch(/\b\d{4}\s?\d{4}\s?\d{4}\b/)
    expect(text).not.toMatch(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/)
    expect(text).not.toMatch(/\b[A-Z]{4}0[A-Z0-9]{6}\b/)
  })
})

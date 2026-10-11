import { describe, expect, it } from 'vitest'
import {
  BudgetAllocatorConfigSchema,
  ClassSummarySchema,
  DocumentInspectorConfigSchema,
  LearnerCodeSchema,
  OfferComparatorConfigSchema,
  ReceiptInspectorConfigSchema,
  ScenarioChainConfigSchema,
  SyncPushSchema,
  TimeSliderConfigSchema,
} from './index'

const text = { titleKey: 't', promptKey: 'p', hintKeys: ['h1', 'h2'], explanationKey: 'e' }

describe('P2 contracts', () => {
  it('parses the new interaction configs and extended P1 configs', () => {
    expect(
      BudgetAllocatorConfigSchema.safeParse({
        ...text,
        availablePaise: 100,
        errors: { noEssentials: 'budget.no_essentials', noSavings: 'budget.no_savings' },
      }).success,
    ).toBe(true)
    expect(
      ReceiptInspectorConfigSchema.safeParse({
        ...text,
        items: [{ id: 'a', labelKey: 'a', amountPaise: 10 }],
        discountPaise: 0,
        taxPaise: 1,
        totalPaise: 11,
        errors: {
          missedTax: 'receipt.missed_tax',
          discountBeforeTax: 'receipt.discount_before_tax',
        },
      }).success,
    ).toBe(true)
    expect(
      TimeSliderConfigSchema.safeParse({
        ...text,
        initialAmountPaise: 100,
        maxYears: 5,
        error: 'inflation.nominal_vs_real',
      }).success,
    ).toBe(true)
    expect(
      ScenarioChainConfigSchema.safeParse({
        ...text,
        links: [{ interaction: 'budgetAllocator', config: {}, carry: ['remaining'] }],
      }).success,
    ).toBe(true)
    expect(
      DocumentInspectorConfigSchema.safeParse({
        titleKey: 't',
        promptKey: 'p',
        fields: [{ id: 'f', labelKey: 'l', valueKey: 'v', isAnswer: true }],
        documentType: 'payslip',
      }).success,
    ).toBe(true)
    expect(
      OfferComparatorConfigSchema.safeParse({
        ...text,
        offers: [
          {
            id: 'a',
            labelKey: 'a',
            principalPaise: 100,
            annualRatePct: 1,
            tenureMonths: 1,
            feesPaise: 0,
            assumptionsKey: 'a',
          },
          {
            id: 'b',
            labelKey: 'b',
            principalPaise: 100,
            annualRatePct: 2,
            tenureMonths: 1,
            feesPaise: 0,
            assumptionsKey: 'b',
            error: 'invest.ignored_horizon',
            severity: 'minor',
          },
        ],
        correctOfferId: 'a',
        investmentInstruments: [
          {
            id: 'fd',
            labelKey: 'fd',
            riskKey: 'low',
            liquidityKey: 'limited',
            timeHorizonKey: 'long',
          },
        ],
      }).success,
    ).toBe(true)
  })

  it('validates anonymous sync and suppresses small class counts', () => {
    expect(LearnerCodeSchema.safeParse('KITE-7Q4M').success).toBe(true)
    const push = {
      attempts: [],
      settings: {
        locale: 'en',
        reducedMotion: 'system',
        muted: false,
        textScale: 1,
        updatedAt: 'now',
      },
      position: { locationId: 'home' },
    }
    expect(SyncPushSchema.safeParse({ ...push, name: 'Asha' }).success).toBe(false)
    expect(
      ClassSummarySchema.safeParse({
        skills: [{ skillNode: 's', learnersAttempted: 3, medianBestStars: 2 }],
      }).success,
    ).toBe(false)
    expect(
      ClassSummarySchema.safeParse({
        skills: [{ skillNode: 's', learnersAttempted: '<5', medianBestStars: '<5' }],
      }).success,
    ).toBe(true)
  })
})

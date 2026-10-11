import { describe, expect, it } from 'vitest'
import {
  DerivedSchema,
  ErrorCategorySchema,
  FRAUD_WARNING_WORLD_EFFECT,
  LocationIdSchema,
  P1_ERROR_CATEGORIES,
  P1_LOCATION_IDS,
  AttemptRecordSchema,
  WORLD_FLAGS,
  WorldEffectSchema,
} from './index'

describe('P1 identifiers', () => {
  it('exports both world flags and accepts the Level 9 installment signal', () => {
    expect(WORLD_FLAGS).toEqual([
      'fraud.seenWarningSigns',
      'loan.activeInstallment',
      'savings.goalMet',
      'insurance.policyInspected',
      'curriculum.completed',
    ])
    const key = 'loan.activeInstallment'
    const flags = { [key]: 'true' }
    expect(WorldEffectSchema.parse({ key, value: 'true' })).toEqual({ key, value: 'true' })
    expect(AttemptRecordSchema.shape.worldChoices.parse(flags)).toEqual(flags)
    expect(DerivedSchema.shape.worldFlags.parse(flags)).toEqual(flags)
  })

  it('exports the P1 locations accepted by the existing schema', () => {
    expect(P1_LOCATION_IDS).toEqual(['phone-shop', 'showroom', 'capstone'])
    for (const id of P1_LOCATION_IDS) {
      expect(LocationIdSchema.parse(id)).toBe(id)
    }
  })

  it('exports the P1 error codes accepted by the existing schema', () => {
    expect(P1_ERROR_CATEGORIES).toEqual([
      'upi.pin_to_receive',
      'upi.wrong_payee',
      'fraud.shared_otp',
      'fraud.clicked_link',
      'fraud.urgency',
      'loan.ignored_total_cost',
      'loan.emi_only',
      'loan.missed_payment',
    ])
    for (const code of P1_ERROR_CATEGORIES) {
      expect(ErrorCategorySchema.parse(code)).toBe(code)
    }
  })

  it('keeps location ids and dotted error codes open beyond P1', () => {
    expect(LocationIdSchema.parse('bank')).toBe('bank')
    expect(LocationIdSchema.parse('future-location')).toBe('future-location')
    expect(ErrorCategorySchema.parse('kyc.wrong_document')).toBe('kyc.wrong_document')
    expect(ErrorCategorySchema.parse('inflation.nominal_vs_real')).toBe('inflation.nominal_vs_real')
    expect(LocationIdSchema.safeParse('').success).toBe(false)
    expect(ErrorCategorySchema.safeParse('nodots').success).toBe(false)
  })

  it('accepts the fraud warning effect and its string-valued derived flag', () => {
    expect(FRAUD_WARNING_WORLD_EFFECT).toEqual({
      key: 'fraud.seenWarningSigns',
      value: 'true',
    })
    expect(WorldEffectSchema.parse(FRAUD_WARNING_WORLD_EFFECT)).toEqual(FRAUD_WARNING_WORLD_EFFECT)
    const { key, value } = FRAUD_WARNING_WORLD_EFFECT
    expect(DerivedSchema.shape.worldFlags.parse({ [key]: value })).toEqual({
      'fraud.seenWarningSigns': 'true',
    })
  })
})

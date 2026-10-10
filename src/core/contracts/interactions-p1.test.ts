import { describe, expect, it } from 'vitest'
import { defaultRubric, score } from '../scoring/rubric'
import {
  MessageTriageConfigSchema,
  OfferComparatorConfigSchema,
  UpiPaymentConfigSchema,
  type InteractionRegistry,
  type MessageTriageConfig,
  type OfferComparatorConfig,
  type UpiPaymentConfig,
} from './ui'

const text = {
  titleKey: 'lesson.title',
  promptKey: 'lesson.prompt',
  hintKeys: ['lesson.hint1', 'lesson.hint2'] as [string, string],
  explanationKey: 'lesson.explanation',
}
const upi: UpiPaymentConfig = {
  ...text,
  mode: 'receive',
  payeeNameKey: 'upi.fictionalPayee',
  payeeHandleKey: 'upi.fictionalHandle',
  amountPaise: 50000,
  noteKey: 'upi.note',
  choices: [
    { id: 'decline', labelKey: 'upi.decline', action: 'decline' },
    {
      id: 'pin',
      labelKey: 'upi.enterPin',
      action: 'enterPin',
      error: 'upi.pin_to_receive',
      severity: 'critical',
    },
  ],
  correctChoiceId: 'decline',
}
const triage: MessageTriageConfig = {
  ...text,
  messages: [
    {
      id: 'otp-trap',
      channel: 'sms',
      senderKey: 'fraud.fictionalSender',
      bodyKey: 'fraud.otpRequest',
      correctClassification: 'fraud',
      warningSigns: [{ id: 'otp-pin-request', labelKey: 'fraud.otpSign' }],
      requiredWarningSignIds: ['otp-pin-request'],
      error: 'fraud.shared_otp',
      severity: 'critical',
    },
    {
      id: 'safe-notice',
      channel: 'chat',
      senderKey: 'fraud.fictionalShop',
      bodyKey: 'fraud.safeNotice',
      correctClassification: 'safe',
      warningSigns: [],
      requiredWarningSignIds: [],
      error: 'fraud.misclassified',
      severity: 'minor',
    },
  ],
}
const comparator: OfferComparatorConfig = {
  ...text,
  offers: [
    {
      id: 'a',
      labelKey: 'loan.offerA',
      principalPaise: 10000000,
      annualRatePct: 12,
      tenureMonths: 12,
      feesPaise: 0,
      assumptionsKey: 'loan.assumptionA',
    },
    {
      id: 'b',
      labelKey: 'loan.offerB',
      principalPaise: 10000000,
      annualRatePct: 12,
      tenureMonths: 36,
      feesPaise: 10000,
      assumptionsKey: 'loan.assumptionB',
      error: 'loan.ignored_total_cost',
      severity: 'major',
    },
  ],
  correctOfferId: 'a',
  budget: { incomePaise: 2000000, rentPaise: 500000, essentialsPaise: 700000 },
}

describe('P1 interaction contracts', () => {
  const fixtures = [
    { schema: UpiPaymentConfigSchema, config: upi },
    { schema: MessageTriageConfigSchema, config: triage },
    { schema: OfferComparatorConfigSchema, config: comparator },
  ]

  it.each(fixtures)('parses a complete fixture without changing it', ({ schema, config }) => {
    expect(schema.parse(config)).toEqual(config)
  })

  it('keeps registry entries optional and typed', () => {
    const registry: InteractionRegistry = {
      upiPayment: ({ config }) => config.correctChoiceId,
      messageTriage: ({ config }) => config.messages[0]?.correctClassification,
      offerComparator: ({ config }) => config.correctOfferId,
    }
    expect(Object.keys(registry)).toEqual(['upiPayment', 'messageTriage', 'offerComparator'])
    const empty: InteractionRegistry = {}
    expect(empty).toEqual({})
  })

  it.each(fixtures)('rejects unknown keys and incomplete localized text', ({ schema, config }) => {
    for (const patch of [
      { extra: true },
      { titleKey: '' },
      { promptKey: ' ' },
      { explanationKey: '' },
      { hintKeys: ['hint.onlyOne'] },
      { hintKeys: ['hint.one', ''] },
    ]) {
      expect(schema.safeParse({ ...config, ...patch }).success).toBe(false)
    }
  })

  it.each([0, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '50000'])(
    'rejects invalid UPI money %s',
    (amountPaise) => {
      expect(UpiPaymentConfigSchema.safeParse({ ...upi, amountPaise }).success).toBe(false)
    },
  )

  it('rejects invalid UPI references, duplicates, feedback and stored PINs', () => {
    for (const patch of [
      { correctChoiceId: 'missing' },
      { choices: [upi.choices[0], upi.choices[0]] },
      { choices: [] },
      { choices: upi.choices.map((choice) => ({ ...choice, severity: undefined })) },
      { choices: upi.choices.map((choice) => ({ ...choice, action: 'sharePin' })) },
      { pin: '1234' },
      { payeeNameKey: '' },
      { payeeHandleKey: '' },
      { noteKey: '' },
    ]) {
      expect(UpiPaymentConfigSchema.safeParse({ ...upi, ...patch }).success).toBe(false)
    }
    expect(
      UpiPaymentConfigSchema.safeParse({
        ...upi,
        choices: upi.choices.map((choice) => ({ ...choice, pin: '1234' })),
      }).success,
    ).toBe(false)
  })

  it('accepts a payment with a wrong-payee decline answer', () => {
    const payment = {
      ...upi,
      mode: 'pay',
      choices: upi.choices.map((choice) =>
        choice.id === 'pin' ? { ...choice, error: 'upi.wrong_payee', severity: 'major' } : choice,
      ),
    }
    expect(UpiPaymentConfigSchema.safeParse(payment).success).toBe(true)
  })

  it('accepts approving a correct payment through the mock PIN action', () => {
    expect(
      UpiPaymentConfigSchema.safeParse({
        ...upi,
        mode: 'pay',
        correctChoiceId: 'pin',
        choices: [
          { id: 'pin', labelKey: 'upi.enterPin', action: 'enterPin' },
          {
            id: 'decline',
            labelKey: 'upi.decline',
            action: 'decline',
            error: 'upi.declined_payment',
            severity: 'minor',
          },
        ],
      }).success,
    ).toBe(true)
  })

  it('rejects rewarding PIN entry on a receive-money request', () => {
    expect(
      UpiPaymentConfigSchema.safeParse({
        ...upi,
        correctChoiceId: 'pin',
        choices: upi.choices.map((choice) =>
          choice.id === 'decline'
            ? { ...choice, error: 'upi.declined_payment', severity: 'minor' }
            : choice,
        ),
      }).success,
    ).toBe(false)
  })

  it('rejects relabeling a receive-PIN mistake as a different error', () => {
    expect(
      UpiPaymentConfigSchema.safeParse({
        ...upi,
        choices: upi.choices.map((choice) =>
          choice.action === 'enterPin' ? { ...choice, error: 'upi.wrong_payee' } : choice,
        ),
      }).success,
    ).toBe(false)
  })

  it.each(['minor', 'major', undefined])('rejects downgraded safety severity: %s', (severity) => {
    for (const error of ['upi.pin_to_receive', 'fraud.shared_otp']) {
      expect(
        UpiPaymentConfigSchema.safeParse({
          ...upi,
          mode: 'pay',
          choices: upi.choices.map((choice) =>
            choice.id === 'pin' ? { ...choice, error, severity } : choice,
          ),
        }).success,
      ).toBe(false)
      expect(
        MessageTriageConfigSchema.safeParse({
          ...triage,
          messages: [{ ...triage.messages[0], error, severity }],
        }).success,
      ).toBe(false)
      expect(
        OfferComparatorConfigSchema.safeParse({
          ...comparator,
          offers: comparator.offers.map((offer) =>
            offer.id === 'b' ? { ...offer, error, severity } : offer,
          ),
        }).success,
      ).toBe(false)
    }
  })

  it('keeps a receive-PIN error at zero stars unresolved and capped at one when corrected', () => {
    const mistake = UpiPaymentConfigSchema.parse(upi).choices.find(
      (choice) => choice.action === 'enterPin',
    )!
    const event = {
      kind: 'choice' as const,
      stepId: defaultRubric.decisionStepId,
      correct: false,
      error: mistake.error,
      severity: mistake.severity,
    }
    expect(score([event], defaultRubric).stars).toBe(0)
    expect(
      score(
        [
          event,
          { kind: 'choice', stepId: defaultRubric.decisionStepId, correct: true },
          { kind: 'choice', stepId: defaultRubric.transferStepId, correct: true },
        ],
        defaultRubric,
      ).stars,
    ).toBe(1)
  })

  it('rejects missing, duplicate or unconfigured required warning signs', () => {
    const fraud = triage.messages[0]!
    for (const patch of [
      { requiredWarningSignIds: [] },
      { requiredWarningSignIds: ['missing'] },
      { requiredWarningSignIds: ['otp-pin-request', 'otp-pin-request'] },
      { warningSigns: [] },
      { warningSigns: [fraud.warningSigns[0], fraud.warningSigns[0]] },
      { warningSigns: [{ id: 'otp-pin-request', labelKey: '' }] },
      { correctClassification: 'unknown' },
      { error: 'invalid' },
      { severity: 'unknown' },
      { otp: '123456' },
    ]) {
      expect(
        MessageTriageConfigSchema.safeParse({
          ...triage,
          messages: [{ ...fraud, ...patch }],
        }).success,
      ).toBe(false)
    }
    expect(MessageTriageConfigSchema.safeParse({ ...triage, messages: [] }).success).toBe(false)
    expect(
      MessageTriageConfigSchema.safeParse({ ...triage, messages: [fraud, fraud] }).success,
    ).toBe(false)
  })

  it.each(['principalPaise', 'tenureMonths', 'feesPaise'] as const)(
    'rejects invalid integer input for %s',
    (field) => {
      const invalid = [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '100']
      if (field !== 'feesPaise') invalid.push(0)
      for (const value of invalid) {
        expect(
          OfferComparatorConfigSchema.safeParse({
            ...comparator,
            offers: comparator.offers.map((offer) => ({ ...offer, [field]: value })),
          }).success,
        ).toBe(false)
      }
    },
  )

  it.each([-1, NaN, Infinity, -Infinity, '12'])(
    'rejects invalid annual percentage %s',
    (annualRatePct) => {
      expect(
        OfferComparatorConfigSchema.safeParse({
          ...comparator,
          offers: comparator.offers.map((offer) => ({ ...offer, annualRatePct })),
        }).success,
      ).toBe(false)
    },
  )

  it('accepts zero rates and fees, fractional percentages, and absent budget', () => {
    for (const annualRatePct of [0, 12.5]) {
      const config = {
        ...comparator,
        budget: undefined,
        offers: comparator.offers.map((offer) => ({ ...offer, annualRatePct, feesPaise: 0 })),
      }
      expect(OfferComparatorConfigSchema.parse(config).offers[0]?.annualRatePct).toBe(annualRatePct)
    }
  })

  it('rejects bad offer answers, duplicates, feedback, labels and stored totals', () => {
    for (const patch of [
      { correctOfferId: 'missing' },
      { offers: [] },
      { offers: [comparator.offers[0], comparator.offers[0]] },
      { offers: comparator.offers.map((offer) => ({ ...offer, error: undefined })) },
      { offers: comparator.offers.map((offer) => ({ ...offer, assumptionsKey: '' })) },
      { offers: comparator.offers.map((offer) => ({ ...offer, emiPaise: 888488 })) },
      { offers: comparator.offers.map((offer) => ({ ...offer, totalRepaidPaise: 10661856 })) },
      { budget: { ...comparator.budget, incomePaise: -1 } },
      { budget: { ...comparator.budget, rentPaise: 0.5 } },
      { budget: { ...comparator.budget, essentialsPaise: Number.MAX_SAFE_INTEGER + 1 } },
      { budget: { ...comparator.budget, realName: 'student' } },
    ]) {
      expect(OfferComparatorConfigSchema.safeParse({ ...comparator, ...patch }).success).toBe(false)
    }
  })
})

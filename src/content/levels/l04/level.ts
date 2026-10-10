import { LevelDefSchema, UpiPaymentConfigSchema, type UpiPaymentConfig } from '@/core/contracts'

const mismatchChoices: UpiPaymentConfig['choices'] = [
  { id: 'approve', labelKey: 'l04:payment.approve', action: 'enterPin', error: 'upi.wrong_payee', severity: 'major' },
  { id: 'decline', labelKey: 'l04:payment.decline', action: 'decline' },
]

const payment = UpiPaymentConfigSchema.parse({
  titleKey: 'l04:decision.title',
  promptKey: 'l04:decision.prompt',
  hintKeys: ['l04:payment.hint1', 'l04:payment.hint2'],
  explanationKey: 'l04:decision.explanation',
  mode: 'pay',
  payeeNameKey: 'l04:decision.payeeName',
  payeeHandleKey: 'l04:decision.payeeHandle',
  amountPaise: 18000,
  noteKey: 'l04:decision.note',
  choices: [
    { id: 'approve', labelKey: 'l04:payment.approve', action: 'enterPin' },
    { id: 'decline', labelKey: 'l04:payment.decline', action: 'decline', error: 'upi.declined_payment', severity: 'minor' },
  ],
  correctChoiceId: 'approve',
})

// Scripted 2-star path: decline the verified decision payment, then approve on retry;
// complete the lesson and transfer safely. PIN-to-receive is critical, never a 2-star mistake.
export const level = LevelDefSchema.parse({
  id: 'l04-upi-basics',
  skillNodes: ['bank.upi'],
  location: 'phone-shop',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l04:hook.1', 'l04:hook.2', 'l04:hook.3'] },
    {
      id: 'lesson', type: 'lesson', interaction: 'upiPayment',
      config: UpiPaymentConfigSchema.parse({
        titleKey: 'l04:lesson.title',
        promptKey: 'l04:lesson.prompt',
        hintKeys: ['l04:lesson.hint1', 'l04:lesson.hint2'],
        explanationKey: 'l04:lesson.explanation',
        mode: 'receive',
        payeeNameKey: 'l04:lesson.payeeName',
        payeeHandleKey: 'l04:lesson.payeeHandle',
        amountPaise: 6000,
        noteKey: 'l04:lesson.note',
        choices: [
          { id: 'decline', labelKey: 'l04:lesson.decline', action: 'decline' },
          { id: 'approve', labelKey: 'l04:lesson.approve', action: 'enterPin', error: 'upi.pin_to_receive', severity: 'critical' },
        ],
        correctChoiceId: 'decline',
      }),
    },
    { id: 'travel', type: 'travel', location: 'phone-shop' },
    {
      id: 'decision', type: 'decision', interaction: 'upiPayment', config: payment,
      rubric: {
        penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
        twoStarMaxPenalty: 2, criticalCap: 1, transferCap: 2,
        decisionStepId: 'decision', transferStepId: 'transfer',
      },
    },
    {
      id: 'consequence', type: 'consequence',
      outcomeKeys: ['l04:consequence.paid'], explanationKey: 'l04:consequence.explanation',
    },
    {
      id: 'transfer', type: 'transfer',
      variants: [
        {
          id: 'leela-repair', interaction: 'upiPayment',
          config: UpiPaymentConfigSchema.parse({
            ...payment,
            titleKey: 'l04:transfer.leela.title', promptKey: 'l04:transfer.leela.prompt',
            payeeNameKey: 'l04:transfer.leela.payeeName', payeeHandleKey: 'l04:transfer.leela.payeeHandle',
            amountPaise: 27500, noteKey: 'l04:transfer.leela.note',
            explanationKey: 'l04:transfer.leela.explanation',
            choices: mismatchChoices, correctChoiceId: 'decline',
          }),
        },
        {
          id: 'kavi-cables', interaction: 'upiPayment',
          config: UpiPaymentConfigSchema.parse({
            ...payment,
            titleKey: 'l04:transfer.kavi.title', promptKey: 'l04:transfer.kavi.prompt',
            payeeNameKey: 'l04:transfer.kavi.payeeName', payeeHandleKey: 'l04:transfer.kavi.payeeHandle',
            amountPaise: 9500, noteKey: 'l04:transfer.kavi.note',
            explanationKey: 'l04:transfer.kavi.explanation',
            choices: [...mismatchChoices].reverse(), correctChoiceId: 'decline',
          }),
        },
      ],
    },
  ],
  worldEffects: [],
  claims: [
    ...['lesson.hint1', 'lesson.hint2', 'lesson.explanation', 'upi.pin_to_receive.review'].map(textKey => ({
      textKey: `l04:${textKey}`, sourceIds: ['npci-bhim-upi-safety', 'npci-bhim-upi-faq'],
      reviewerRole: 'Human educator approval (user-reported); AI agent source check', reviewedOn: '2026-10-10',
    })),
    ...['payment.hint1', 'payment.hint2', 'decision.explanation', 'transfer.leela.explanation', 'transfer.kavi.explanation', 'upi.wrong_payee.review', 'upi.declined_payment.review'].map(textKey => ({
      textKey: `l04:${textKey}`, sourceIds: ['npci-bhim-upi-faq'],
      reviewerRole: 'Human educator approval (user-reported); AI agent source check', reviewedOn: '2026-10-10',
    })),
  ],
})

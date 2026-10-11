import { LevelDefSchema } from '@/core/contracts'

const reviewerRole = 'NGO educator (pending sign-off)'
const reviewedOn = '2026-10-11'
const claim = (textKey: string) => ({ textKey, sourceIds: ['itd-salaried-individuals'], reviewerRole, reviewedOn })

const rubric = {
  penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
  twoStarMaxPenalty: 2,
  criticalCap: 1,
  transferCap: 2,
  decisionStepId: 'decision',
  transferStepId: 'transfer',
}

const payslipFields = (ns: string, withExtra: boolean) => [
  ...(withExtra ? [{ id: 'extra', labelKey: `${ns}.extraLabel`, valueKey: `${ns}.extraValue`, isAnswer: false, error: 'payslip.gross_as_net' }] : []),
  { id: 'gross', labelKey: `${ns}.grossLabel`, valueKey: `${ns}.grossValue`, isAnswer: false, error: 'payslip.gross_as_net' },
  { id: 'deductions', labelKey: `${ns}.deductionsLabel`, valueKey: `${ns}.deductionsValue`, isAnswer: false, error: 'payslip.gross_as_net' },
  { id: 'net', labelKey: `${ns}.netLabel`, valueKey: `${ns}.netValue`, isAnswer: true },
]

// P2-14 mistake path: tap the gross pay in the decision (payslip.gross_as_net), correct to net pay,
// then answer the transfer correctly. One error earns 2 stars; a clean run earns 3.
// All people, amounts and rates are fictional assumptions.
export const level = LevelDefSchema.parse({
  id: 'l08-payslip',
  skillNodes: ['borrowing.income'],
  location: 'workplace',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l08:hook.1', 'l08:hook.2', 'l08:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'documentInspector',
      config: {
        titleKey: 'l08:lesson.title',
        promptKey: 'l08:lesson.prompt',
        documentType: 'payslip',
        fields: payslipFields('l08:lesson', false),
      },
    },
    { id: 'travel', type: 'travel', location: 'workplace' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'documentInspector',
      config: {
        titleKey: 'l08:decision.title',
        promptKey: 'l08:decision.prompt',
        documentType: 'payslip',
        fields: payslipFields('l08:decision', false),
      },
      rubric,
    },
    {
      id: 'consequence',
      type: 'consequence',
      outcomeKeys: ['l08:consequence.net', 'l08:consequence.deductions'],
      explanationKey: 'l08:consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'dev-yearly-total',
          interaction: 'documentInspector',
          config: {
            titleKey: 'l08:transfer.dev.title',
            promptKey: 'l08:transfer.prompt',
            documentType: 'payslip',
            fields: payslipFields('l08:transfer.dev', true),
          },
        },
        {
          id: 'ila-employer-cost',
          interaction: 'documentInspector',
          config: {
            titleKey: 'l08:transfer.ila.title',
            promptKey: 'l08:transfer.prompt',
            documentType: 'payslip',
            fields: payslipFields('l08:transfer.ila', true),
          },
        },
      ],
    },
  ],
  worldEffects: [],
  claims: [
    claim('l08:claim.tds'),
    claim('l08:claim.form16'),
    claim('l08:payslip.gross_as_net.review'),
  ],
})

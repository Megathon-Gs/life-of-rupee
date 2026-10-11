import { LevelDefSchema } from '@/core/contracts'

const reviewerRole = 'NGO educator (sign-off pending)'
const reviewedOn = '2026-10-11'
const claim = (textKey: string, ...sourceIds: string[]) => ({ textKey, sourceIds, reviewerRole, reviewedOn })

/**
 * Fictional policies and rates. Premiums, deductibles and caps are assumptions, not market rates.
 * Lesson: tap the fuller cover's policy card (the basic card is the ignored-deductible trap).
 * Cover 1 "Basic": premium ₹1,200 a year, deductible ₹5,000, cap ₹20,000.
 * Cover 2 "Fuller": premium ₹2,400 a year, deductible ₹1,000, cap ₹40,000.
 * Incident: scooter repair ₹18,000 after an accident (covered). Transfer: excluded events.
 *
 * Mistake path: in the decision, tap the whole-repair field (insurance.ignored_deductible),
 * correct it to the deductible field, then answer the transfer correctly: 2 stars; clean run: 3.
 */
export const level = LevelDefSchema.parse({
  id: 'l10-insurance',
  skillNodes: ['safety.insurance'],
  location: 'insurance-desk',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l10:hook.1', 'l10:hook.2', 'l10:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'documentInspector',
      config: {
        titleKey: 'l10:lesson.title',
        promptKey: 'l10:lesson.prompt',
        documentType: 'insurance-policy',
        claimEventKey: 'l10:lesson.event',
        fields: [
          { id: 'basic', labelKey: 'l10:lesson.basicLabel', valueKey: 'l10:lesson.basicValue', isAnswer: false, error: 'insurance.ignored_deductible' },
          { id: 'fuller', labelKey: 'l10:lesson.fullerLabel', valueKey: 'l10:lesson.fullerValue', isAnswer: true },
        ],
      },
    },
    { id: 'travel', type: 'travel', location: 'insurance-desk' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'documentInspector',
      config: {
        titleKey: 'l10:decision.title',
        promptKey: 'l10:decision.prompt',
        documentType: 'insurance-policy',
        claimEventKey: 'l10:decision.event',
        fields: [
          { id: 'wholeRepair', labelKey: 'l10:decision.wholeLabel', valueKey: 'l10:decision.wholeValue', isAnswer: false, error: 'insurance.ignored_deductible' },
          { id: 'excluded', labelKey: 'l10:decision.excludedLabel', valueKey: 'l10:decision.excludedValue', isAnswer: false, error: 'insurance.excluded_event' },
          { id: 'afterDeductible', labelKey: 'l10:decision.deductibleLabel', valueKey: 'l10:decision.deductibleValue', isAnswer: true },
        ],
      },
      rubric: {
        penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
        twoStarMaxPenalty: 2,
        criticalCap: 1,
        transferCap: 2,
        decisionStepId: 'decision',
        transferStepId: 'transfer',
      },
    },
    {
      id: 'consequence',
      type: 'consequence',
      outcomeKeys: ['l10:consequence.paid', 'l10:consequence.youPay'],
      explanationKey: 'l10:consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'battery-wear', interaction: 'formFiller',
          config: {
            titleKey: 'l10:transfer.battery.title',
            fields: [
              {
                id: 'whoPays', labelKey: 'l10:transfer.battery.payerLabel',
                options: [
                  { id: 'insurer', labelKey: 'l10:transfer.insurer' },
                  { id: 'emergencyFund', labelKey: 'l10:transfer.emergencyFund' },
                ],
                correctOptionId: 'emergencyFund', error: 'insurance.excluded_event',
              },
              {
                id: 'cause', labelKey: 'l10:transfer.battery.causeLabel',
                options: [
                  { id: 'noInsurance', labelKey: 'l10:transfer.battery.noInsurance' },
                  { id: 'wear', labelKey: 'l10:transfer.battery.wear' },
                ],
                correctOptionId: 'wear', error: 'insurance.excluded_event',
              },
            ],
          },
        },
        {
          id: 'flood-damage', interaction: 'formFiller',
          config: {
            titleKey: 'l10:transfer.flood.title',
            fields: [
              {
                id: 'whoPays', labelKey: 'l10:transfer.flood.payerLabel',
                options: [
                  { id: 'emergencyFund', labelKey: 'l10:transfer.emergencyFund' },
                  { id: 'insurer', labelKey: 'l10:transfer.insurer' },
                  { id: 'nobody', labelKey: 'l10:transfer.flood.nobody' },
                ],
                correctOptionId: 'emergencyFund', error: 'insurance.excluded_event',
              },
            ],
          },
        },
      ],
    },
  ],
  worldEffects: [{ key: 'insurance.policyInspected', value: 'true' }],
  claims: [
    claim('l10:claim.readTerms', 'ncfe-misselling'),
    claim('l10:claim.cover', 'ncfe-why-buy-life-insurance'),
    claim('l10:claim.complaints', 'irdai-bima-bharosa'),
    claim('l10:hook.2', 'ncfe-misselling'),
  ],
})

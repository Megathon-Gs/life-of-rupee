import { LevelDefSchema } from '@/core/contracts'

const reviewerRole = 'NGO educator (sign-off pending)'
const reviewedOn = '2026-10-11'
const claim = (textKey: string, ...sourceIds: string[]) => ({ textKey, sourceIds, reviewerRole, reviewedOn })

const error = 'saving.ignored_liquidity'

/**
 * Fictional deposits and rates. Every rate and amount is an assumption, not a market rate.
 * Lesson: ₹10,000 at 4% a year; the correct answer is that locked money earns more only if it stays.
 * Decision: ₹10,000 now, ₹11,000 needed in exactly 2 years. Savings 2% (reaches ₹10,404, short),
 * recurring deposit (matures after year 3), 5-year fixed deposit at 6% (closed early at year 2 it
 * pays only the savings rate, so ₹10,404, short of the goal),
 * 2-year fixed deposit at 6% (₹11,236 on the date, correct). The slider shows 6% growth.
 * Transfer, both liquid-correct with different assumptions: Kabir (fee in 3 months) and Asha
 * (₹5,000, fee in about 8 months, 2.5% savings against 9% fixed deposits).
 *
 * Mistake path: in the decision, pick the 5-year fixed deposit (`fd5`, the highest maturity amount)
 * (saving.ignored_liquidity), correct it to `fd2`, then answer the transfer correctly: 2 stars;
 * clean run: 3.
 */
export const level = LevelDefSchema.parse({
  id: 'l03-saving',
  skillNodes: ['money.saving'],
  location: 'bank',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l03:hook.1', 'l03:hook.2', 'l03:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'timeSlider',
      config: {
        titleKey: 'l03:lesson.title',
        promptKey: 'l03:lesson.prompt',
        hintKeys: ['l03:lesson.hint1', 'l03:lesson.hint2'],
        explanationKey: 'l03:lesson.explanation',
        initialAmountPaise: 1_000_000,
        annualRatePct: 4,
        maxYears: 3,
        error,
        choices: [
          { id: 'earlyFullRate', labelKey: 'l03:lesson.wrongChoice', severity: 'minor' },
          { id: 'lockedOnlyIfLeft', labelKey: 'l03:lesson.rightChoice' },
        ],
        correctChoiceId: 'lockedOnlyIfLeft',
      },
    },
    { id: 'travel', type: 'travel', location: 'bank' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'timeSlider',
      config: {
        titleKey: 'l03:decision.title',
        promptKey: 'l03:decision.prompt',
        hintKeys: ['l03:decision.hint1', 'l03:decision.hint2'],
        explanationKey: 'l03:decision.explanation',
        initialAmountPaise: 1_000_000,
        annualRatePct: 6,
        maxYears: 5,
        error,
        choices: [
          { id: 'savings', labelKey: 'l03:decision.savings', severity: 'minor' },
          { id: 'rd', labelKey: 'l03:decision.rd' },
          { id: 'fd5', labelKey: 'l03:decision.fd5' },
          { id: 'fd2', labelKey: 'l03:decision.fd2' },
        ],
        correctChoiceId: 'fd2',
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
      outcomeKeys: ['l03:consequence.matured', 'l03:consequence.compare'],
      explanationKey: 'l03:consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'kabir-trip-fee', interaction: 'formFiller',
          config: {
            titleKey: 'l03:transfer.kabir.title',
            fields: [
              {
                id: 'where', labelKey: 'l03:transfer.kabir.whereLabel',
                options: [
                  { id: 'fd', labelKey: 'l03:transfer.kabir.fd' },
                  { id: 'savings', labelKey: 'l03:transfer.kabir.savings' },
                  { id: 'rd', labelKey: 'l03:transfer.kabir.rd' },
                ],
                correctOptionId: 'savings', error,
              },
            ],
          },
        },
        {
          id: 'asha-exam-fee', interaction: 'timeSlider',
          config: {
            titleKey: 'l03:transfer.asha.title',
            promptKey: 'l03:transfer.asha.prompt',
            hintKeys: ['l03:transfer.asha.hint1', 'l03:transfer.asha.hint2'],
            explanationKey: 'l03:transfer.asha.explanation',
            initialAmountPaise: 500_000,
            annualRatePct: 2.5,
            maxYears: 1,
            error,
            choices: [
              { id: 'savings', labelKey: 'l03:transfer.asha.savings' },
              { id: 'fd1', labelKey: 'l03:transfer.asha.fd1' },
              { id: 'fd3', labelKey: 'l03:transfer.asha.fd3' },
            ],
            correctChoiceId: 'savings',
          },
        },
      ],
    },
  ],
  worldEffects: [{ key: 'savings.goalMet', value: 'true' }],
  claims: [
    claim('l03:claim.depositTypes', 'ncfe-banking-faq'),
    claim('l03:claim.termHigher', 'ncfe-banking-faq'),
    claim('l03:claim.lockIn', 'ncfe-banking-faq', 'ncfe-fd-calculator'),
    claim('l03:claim.interest', 'ncfe-banking-faq'),
    claim('l03:claim.compounding', 'ncfe-interest-calculator'),
    claim('l03:lesson.explanation', 'ncfe-banking-faq', 'ncfe-fd-calculator'),
    claim('l03:consequence.explanation', 'ncfe-banking-faq', 'ncfe-interest-calculator'),
    claim('l03:saving.ignored_liquidity.review', 'ncfe-banking-faq'),
  ],
})

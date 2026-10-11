import { LevelDefSchema } from '@/core/contracts'

const rupees = (amount: number) => amount * 100
const reviewerRole = 'NGO educator (sign-off pending)'
const reviewedOn = '2026-10-11'
const claim = (textKey: string, ...sourceIds: string[]) => ({ textKey, sourceIds, reviewerRole, reviewedOn })

const errors = { noEssentials: 'budget.no_essentials', noSavings: 'budget.no_savings' }
const rubric = {
  penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
  twoStarMaxPenalty: 2,
  criticalCap: 1,
  transferCap: 2,
  decisionStepId: 'decision',
  transferStepId: 'transfer',
}

/**
 * Fictional stipends and prices; no interest is assumed on savings.
 * Decision: Kiran's ₹4,000 stipend, ₹2,000 of needs. Clean plan: needs ₹2,000, wants ₹1,000, savings ₹1,000.
 * Transfer: Rohan (₹5,000, needs ₹2,500, surprise ₹1,000) and Sana (₹3,000, needs ₹1,500, surprise ₹500);
 * the surprise expense is locked into needs, so the plan must be revised around it.
 *
 * Mistake path: put too little in needs (budget.no_essentials), correct it, then answer the
 * transfer correctly: 2 stars; clean run: 3.
 */
export const level = LevelDefSchema.parse({
  id: 'l01-budget',
  skillNodes: ['money.budgeting'],
  location: 'home',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l01:hook.1', 'l01:hook.2', 'l01:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'documentInspector',
      config: {
        titleKey: 'l01:lesson.title',
        promptKey: 'l01:lesson.prompt',
        fields: [
          { id: 'busPass', labelKey: 'l01:lesson.busPassLabel', valueKey: 'l01:lesson.busPassValue', isAnswer: true },
          { id: 'concert', labelKey: 'l01:lesson.concertLabel', valueKey: 'l01:lesson.concertValue', isAnswer: false },
          { id: 'snacks', labelKey: 'l01:lesson.snacksLabel', valueKey: 'l01:lesson.snacksValue', isAnswer: false },
        ],
      },
    },
    { id: 'travel', type: 'travel', location: 'home' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'budgetAllocator',
      config: {
        titleKey: 'l01:decision.title',
        promptKey: 'l01:decision.prompt',
        hintKeys: ['l01:decision.hint1', 'l01:decision.hint2'],
        explanationKey: 'l01:decision.explanation',
        availablePaise: rupees(4_000),
        essentialsPaise: rupees(2_000),
        errors,
      },
      rubric,
    },
    {
      id: 'consequence',
      type: 'consequence',
      outcomeKeys: ['l01:consequence.plan', 'l01:consequence.savings'],
      explanationKey: 'l01:consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'rohan-bicycle-repair', interaction: 'budgetAllocator',
          config: {
            titleKey: 'l01:transfer.rohan.title',
            promptKey: 'l01:transfer.rohan.prompt',
            hintKeys: ['l01:transfer.rohan.hint1', 'l01:transfer.rohan.hint2'],
            explanationKey: 'l01:transfer.explanation',
            availablePaise: rupees(5_000),
            essentialsPaise: rupees(2_500),
            recurringCommitmentPaise: rupees(1_000),
            errors,
          },
        },
        {
          id: 'sana-lab-fee', interaction: 'budgetAllocator',
          config: {
            titleKey: 'l01:transfer.sana.title',
            promptKey: 'l01:transfer.sana.prompt',
            hintKeys: ['l01:transfer.sana.hint1', 'l01:transfer.sana.hint2'],
            explanationKey: 'l01:transfer.explanation',
            availablePaise: rupees(3_000),
            essentialsPaise: rupees(1_500),
            recurringCommitmentPaise: rupees(500),
            errors,
          },
        },
      ],
    },
  ],
  worldEffects: [{ key: 'home.budgetPlanned', value: 'true' }],
  claims: [
    claim('l01:claim.needsWants', 'rbi-fame-school-children'),
    claim('l01:claim.budget', 'rbi-fame-school-children'),
    claim('l01:claim.prioritise', 'ncfe-financial-wellbeing'),
    claim('l01:claim.differentiate', 'ncfe-financial-wellbeing'),
    claim('l01:hook.2', 'rbi-fame-school-children'),
    claim('l01:lesson.prompt', 'rbi-fame-school-children'),
    claim('l01:budget.no_essentials.review', 'ncfe-financial-wellbeing'),
    claim('l01:budget.no_savings.review', 'ncfe-financial-wellbeing'),
  ],
})

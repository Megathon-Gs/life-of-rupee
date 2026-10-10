import { LevelDefSchema } from '@/core/contracts'

const rupees = (amount: number) => amount * 100
const reviewerRole = 'NGO educator (user approval)'
const reviewedOn = '2026-10-10'
const claim = (textKey: string, ...sourceIds: string[]) => ({
  textKey,
  sourceIds,
  reviewerRole,
  reviewedOn,
})

// P1-08 mistake path: choose the low-EMI, 60-month offer in the decision (loan.ignored_total_cost),
// correct to the 18-month offer, then answer the transfer correctly. One major error earns 2 stars;
// a clean run earns 3. All people, offers and numbers are fictional.
export const level = LevelDefSchema.parse({
  id: 'l09-loans-emi',
  skillNodes: ['borrowing.emi'],
  location: 'showroom',
  steps: [
    {
      // Return-visit memory: only shown when the Level 5 warning-sign lesson was completed.
      id: 'hook',
      type: 'hook',
      when: { flag: 'fraud.seenWarningSigns', equals: 'true' },
      lineKeys: ['l09:hook.1', 'l09:hook.2', 'l09:hook.3'],
    },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'offerComparator',
      config: {
        titleKey: 'l09:lesson.title',
        promptKey: 'l09:lesson.prompt',
        hintKeys: ['l09:lesson.hint1', 'l09:lesson.hint2'],
        explanationKey: 'l09:lesson.explanation',
        offers: [
          {
            id: 'twelve-months',
            labelKey: 'l09:lesson.twelveLabel',
            principalPaise: rupees(60_000),
            annualRatePct: 12,
            tenureMonths: 12,
            feesPaise: rupees(600),
            assumptionsKey: 'l09:lesson.twelveAssumptions',
          },
          {
            id: 'thirty-six-months',
            labelKey: 'l09:lesson.thirtySixLabel',
            principalPaise: rupees(60_000),
            annualRatePct: 12,
            tenureMonths: 36,
            feesPaise: rupees(600),
            assumptionsKey: 'l09:lesson.thirtySixAssumptions',
            error: 'loan.ignored_total_cost',
            severity: 'major',
          },
        ],
        correctOfferId: 'twelve-months',
      },
    },
    { id: 'travel', type: 'travel', location: 'showroom' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'offerComparator',
      config: {
        titleKey: 'l09:decision.title',
        promptKey: 'l09:decision.prompt',
        hintKeys: ['l09:decision.hint1', 'l09:decision.hint2'],
        explanationKey: 'l09:decision.explanation',
        offers: [
          {
            id: 'sixty-months',
            labelKey: 'l09:decision.sixtyLabel',
            principalPaise: rupees(60_000),
            annualRatePct: 12,
            tenureMonths: 60,
            feesPaise: rupees(600),
            assumptionsKey: 'l09:decision.sixtyAssumptions',
            error: 'loan.ignored_total_cost',
            severity: 'major',
          },
          {
            id: 'eighteen-months',
            labelKey: 'l09:decision.eighteenLabel',
            principalPaise: rupees(60_000),
            annualRatePct: 12,
            tenureMonths: 18,
            feesPaise: rupees(600),
            assumptionsKey: 'l09:decision.eighteenAssumptions',
          },
          {
            id: 'thirty-six-high-fee',
            labelKey: 'l09:decision.thirtySixLabel',
            principalPaise: rupees(60_000),
            annualRatePct: 12,
            tenureMonths: 36,
            feesPaise: rupees(3_000),
            assumptionsKey: 'l09:decision.thirtySixAssumptions',
            error: 'loan.emi_only',
            severity: 'major',
          },
        ],
        correctOfferId: 'eighteen-months',
        budget: {
          incomePaise: rupees(42_000),
          rentPaise: rupees(15_000),
          essentialsPaise: rupees(17_000),
        },
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
      outcomeKeys: ['l09:consequence.squeeze', 'l09:consequence.ends'],
      explanationKey: 'l09:consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'kiran-tools-loan',
          interaction: 'offerComparator',
          config: {
            titleKey: 'l09:transfer.kiran.title',
            promptKey: 'l09:transfer.kiran.prompt',
            hintKeys: ['l09:transfer.kiran.hint1', 'l09:transfer.kiran.hint2'],
            explanationKey: 'l09:transfer.kiran.explanation',
            offers: [
              {
                id: 'twelve-months',
                labelKey: 'l09:transfer.kiran.twelveLabel',
                principalPaise: rupees(48_000),
                annualRatePct: 12,
                tenureMonths: 12,
                feesPaise: 0,
                assumptionsKey: 'l09:transfer.kiran.twelveAssumptions',
                error: 'loan.missed_payment',
                severity: 'major',
              },
              {
                id: 'forty-eight-months',
                labelKey: 'l09:transfer.kiran.fortyEightLabel',
                principalPaise: rupees(48_000),
                annualRatePct: 12,
                tenureMonths: 48,
                feesPaise: 0,
                assumptionsKey: 'l09:transfer.kiran.fortyEightAssumptions',
                error: 'loan.ignored_total_cost',
                severity: 'major',
              },
              {
                id: 'twenty-four-months',
                labelKey: 'l09:transfer.kiran.twentyFourLabel',
                principalPaise: rupees(48_000),
                annualRatePct: 12,
                tenureMonths: 24,
                feesPaise: rupees(1_200),
                assumptionsKey: 'l09:transfer.kiran.twentyFourAssumptions',
              },
            ],
            correctOfferId: 'twenty-four-months',
            budget: {
              incomePaise: rupees(29_000),
              rentPaise: rupees(10_000),
              essentialsPaise: rupees(15_000),
            },
          },
        },
        {
          id: 'ravi-postpone',
          interaction: 'formFiller',
          config: {
            titleKey: 'l09:transfer.ravi.title',
            fields: [
              {
                id: 'borrowingChoice',
                labelKey: 'l09:transfer.ravi.choiceLabel',
                options: [
                  { id: 'fortyEight', labelKey: 'l09:transfer.ravi.fortyEight' },
                  { id: 'postpone', labelKey: 'l09:transfer.ravi.postpone' },
                  { id: 'twentyFour', labelKey: 'l09:transfer.ravi.twentyFour' },
                ],
                correctOptionId: 'postpone',
                error: 'loan.emi_only',
              },
              {
                id: 'totalCost',
                labelKey: 'l09:transfer.ravi.totalLabel',
                options: [
                  { id: 'lowerEmiCheaper', labelKey: 'l09:transfer.ravi.totalWrong' },
                  { id: 'lowerEmiCostsMore', labelKey: 'l09:transfer.ravi.totalRight' },
                ],
                correctOptionId: 'lowerEmiCostsMore',
                error: 'loan.ignored_total_cost',
              },
              {
                id: 'missedInstalment',
                labelKey: 'l09:transfer.ravi.missedLabel',
                options: [
                  { id: 'dueWithCharge', labelKey: 'l09:transfer.ravi.missedRight' },
                  { id: 'harmlessSkip', labelKey: 'l09:transfer.ravi.missedWrong' },
                ],
                correctOptionId: 'dueWithCharge',
                error: 'loan.missed_payment',
              },
            ],
          },
        },
      ],
    },
  ],
  worldEffects: [],
  claims: [
    claim('l09:claim.kfs', 'rbi-key-facts-statement'),
    claim('l09:claim.kfsValidity', 'rbi-key-facts-statement'),
    claim('l09:claim.apr', 'rbi-key-facts-statement'),
    claim('l09:claim.unlistedFees', 'rbi-key-facts-statement'),
    claim('l09:claim.emi', 'rbi-key-facts-statement'),
    claim('l09:claim.penalCharges', 'rbi-penal-charges-loan-accounts'),
    claim(
      'l09:claim.penalDisclosure',
      'rbi-penal-charges-loan-accounts',
      'rbi-key-facts-statement',
    ),
    claim('l09:claim.emiOrTenor', 'rbi-emi-personal-loans-reset'),
    claim('l09:hook.2', 'rbi-key-facts-statement'),
    claim('l09:lesson.explanation', 'rbi-emi-personal-loans-reset'),
    claim(
      'l09:consequence.explanation',
      'rbi-penal-charges-loan-accounts',
      'rbi-key-facts-statement',
    ),
    claim('l09:loan.emi_only.review', 'rbi-key-facts-statement'),
    claim('l09:loan.missed_payment.review', 'rbi-penal-charges-loan-accounts'),
  ],
})

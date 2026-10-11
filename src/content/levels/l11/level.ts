import {
  LevelDefSchema,
  OfferComparatorConfigSchema,
  TimeSliderConfigSchema,
} from '@/core/contracts'

const instrumentIds = ['fd', 'bonds', 'mutualFunds', 'equities'] as const

const comparison = (
  scene: 'decision' | 'transfer.books' | 'transfer.course',
  correctOfferId: string,
) =>
  OfferComparatorConfigSchema.parse({
    titleKey: `l11:${scene}.title`,
    promptKey: `l11:${scene}.prompt`,
    hintKeys: ['l11:compare.hint1', 'l11:compare.hint2'],
    explanationKey: `l11:${scene}.explanation`,
    // shortcut: investment mode ignores required loan inputs; remove when the investment schema replaces them.
    offers: instrumentIds.map((id) => ({
      id,
      labelKey: `l11:${scene}.${id}`,
      principalPaise: 1_000_000,
      annualRatePct: 0,
      tenureMonths: 12,
      feesPaise: 0,
      assumptionsKey: 'l11:compare.assumption',
      ...(id === correctOfferId
        ? {}
        : {
            error:
              scene === 'decision'
                ? id === 'equities'
                  ? 'investing.concentrated_risk'
                  : 'investing.guaranteed_return'
                : 'investing.ignored_horizon',
            severity: 'major',
          }),
    })),
    correctOfferId,
    investmentInstruments: instrumentIds.map((id) => ({
      id,
      labelKey: `l11:${scene}.${id}`,
      riskKey: `l11:instrument.${id}.risk`,
      liquidityKey: `l11:instrument.${id}.liquidity`,
      timeHorizonKey: `l11:instrument.${id}.horizon`,
    })),
  })

const claim = (textKey: string, ...sourceIds: string[]) => ({
  textKey: `l11:${textKey}`,
  sourceIds,
  reviewerRole: 'Source check by coding agent; NGO educator sign-off pending',
  reviewedOn: '2026-10-11',
})

// Mistake path: choose equities in Decision, correct to mutualFunds, then choose fd in Transfer.
// One concentrated-risk error gives 2 stars; a clean run gives 3. These are fictional comparisons,
// not recommendations. P2-25 owns registration; educator and Telugu review remain release gates.
export const level = LevelDefSchema.parse({
  id: 'l11-investing',
  skillNodes: ['growth.investing'],
  location: 'learning-centre',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l11:hook.1', 'l11:hook.2', 'l11:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'timeSlider',
      config: TimeSliderConfigSchema.parse({
        titleKey: 'l11:lesson.title',
        promptKey: 'l11:lesson.prompt',
        hintKeys: ['l11:lesson.hint1', 'l11:lesson.hint2'],
        explanationKey: 'l11:lesson.explanation',
        initialAmountPaise: 1_000_000,
        annualRatePct: 6,
        annualInflationPct: 4,
        rangeSpreadPct: 2,
        maxYears: 8,
        error: 'investing.guaranteed_return',
        choices: [
          {
            id: 'promise',
            labelKey: 'l11:lesson.promise',
            error: 'investing.guaranteed_return',
            severity: 'major',
          },
          { id: 'assumption', labelKey: 'l11:lesson.assumption' },
        ],
        correctChoiceId: 'assumption',
      }),
    },
    { id: 'travel', type: 'travel', location: 'learning-centre' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'offerComparator',
      config: comparison('decision', 'mutualFunds'),
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
      outcomeKeys: ['l11:consequence.range'],
      explanationKey: 'l11:consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'books-next-term',
          interaction: 'offerComparator',
          config: comparison('transfer.books', 'fd'),
        },
        {
          id: 'course-fee',
          interaction: 'offerComparator',
          config: comparison('transfer.course', 'fd'),
        },
      ],
    },
  ],
  worldEffects: [],
  claims: [
    ...[
      'hook.2',
      'lesson.prompt',
      'lesson.hint1',
      'lesson.explanation',
      'lesson.assumption',
      'consequence.explanation',
      'instrument.fd.horizon',
      'instrument.mutualFunds.horizon',
      'instrument.equities.horizon',
      'compare.hint1',
      'transfer.books.explanation',
      'transfer.course.explanation',
      'investing.guaranteed_return.review',
      'investing.ignored_horizon.review',
    ].map((key) => claim(key, 'l11-sebi-investment-factors')),
    ...[
      'hook.3',
      'compare.hint2',
      'decision.explanation',
      'investing.concentrated_risk.review',
    ].map((key) => claim(key, 'l11-sebi-risk-management')),
    claim('instrument.equities.risk', 'l11-sebi-asset-classes', 'l11-sebi-risk-management'),
    claim('instrument.fd.risk', 'l11-ncfe-banking', 'l11-sebi-risk-management'),
    claim('instrument.fd.liquidity', 'l11-ncfe-banking'),
    ...['instrument.bonds.risk', 'instrument.bonds.liquidity', 'instrument.bonds.horizon'].map(
      (key) => claim(key, 'l11-sebi-bonds'),
    ),
    ...['instrument.mutualFunds.risk', 'decision.mutualFunds'].map((key) =>
      claim(key, 'l11-sebi-mutual-funds', 'l11-sebi-investment-factors'),
    ),
    claim('instrument.mutualFunds.liquidity', 'l11-ncfe-mutual-funds'),
    claim('instrument.equities.liquidity', 'l11-sebi-investment-factors'),
  ],
})

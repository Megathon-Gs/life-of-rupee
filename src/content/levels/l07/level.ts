import { LevelDefSchema, TimeSliderConfigSchema } from '@/core/contracts'

const error = 'inflation.nominal_vs_real'
const basket = (section: string, initialAmountPaise: number, annualInflationPct: number, maxYears: number, correctChoiceId: string) => TimeSliderConfigSchema.parse({
  titleKey: `l07:${section}.title`,
  promptKey: `l07:${section}.prompt`,
  hintKeys: [`l07:${section}.hint1`, `l07:${section}.hint2`],
  explanationKey: `l07:${section}.explanation`,
  initialAmountPaise, annualInflationPct, maxYears, error,
  choices: ['more', 'same', 'less'].map(id => ({
    id, labelKey: `l07:choices.${id}`,
    ...(id !== correctChoiceId ? { error, severity: 'major' as const } : {}),
  })),
  correctChoiceId,
})

// Scripted mistake: decision “more”, then “less”, then correct transfer → 2 stars; clean → 3.
// Basket mode charts prices; the prompt supplies the separate, fixed savings assumptions.
export const level = LevelDefSchema.parse({
  id: 'l07-inflation',
  skillNodes: ['inflation.purchasing_power'],
  location: 'market',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l07:hook.1', 'l07:hook.2', 'l07:hook.3'] },
    { id: 'lesson', type: 'lesson', interaction: 'timeSlider', config: basket('lesson', 100000, 10, 2, 'less') },
    { id: 'travel', type: 'travel', location: 'market' },
    {
      id: 'decision', type: 'decision', interaction: 'timeSlider',
      config: basket('decision', 100000, 6, 3, 'less'),
      rubric: {
        penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
        twoStarMaxPenalty: 2, criticalCap: 1, transferCap: 2,
        decisionStepId: 'decision', transferStepId: 'transfer',
      },
    },
    {
      id: 'consequence', type: 'consequence',
      outcomeKeys: ['l07:consequence.basket', 'l07:consequence.savings', 'l07:consequence.gap'],
      explanationKey: 'l07:consequence.explanation',
    },
    {
      id: 'transfer', type: 'transfer', variants: [
        { id: 'school-supplies', interaction: 'timeSlider', config: basket('transfer.school', 60000, 5, 2, 'less') },
        { id: 'cleaning-supplies', interaction: 'timeSlider', config: basket('transfer.cleaning', 80000, 8, 2, 'more') },
      ],
    },
  ],
  worldEffects: [],
  claims: [
    {
      textKey: 'l07:hook.2', sourceIds: ['l07-rbi-financial-literacy-guide'],
      reviewerRole: 'AI source check; NGO educator sign-off pending', reviewedOn: '2026-10-11',
    },
    ...[
      'hook.3', 'lesson.prompt', 'lesson.hint1', 'lesson.hint2', 'lesson.explanation',
      'decision.prompt', 'decision.hint1', 'decision.hint2', 'decision.explanation',
      'consequence.basket', 'consequence.savings', 'consequence.gap', 'consequence.explanation',
      'transfer.school.prompt', 'transfer.school.hint1', 'transfer.school.hint2', 'transfer.school.explanation',
      'transfer.cleaning.prompt', 'transfer.cleaning.hint1', 'transfer.cleaning.hint2', 'transfer.cleaning.explanation',
      'inflation.nominal_vs_real.review',
    ].map(key => ({
      textKey: `l07:${key}`, sourceIds: ['l07-ncfe-financial-planning'],
      reviewerRole: 'AI source check; NGO educator sign-off pending', reviewedOn: '2026-10-11',
    })),
  ],
})

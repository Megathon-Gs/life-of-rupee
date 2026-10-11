import {
  BudgetAllocatorConfigSchema,
  LevelDefSchema,
  MessageTriageConfigSchema,
  OfferComparatorConfigSchema,
  ScenarioChainConfigSchema,
  TimeSliderConfigSchema,
  UpiPaymentConfigSchema,
} from '@/core/contracts'
import { rupees } from '@/core/finance/money'

const reviewerRole = 'Source check by coding agent; NGO educator sign-off pending'
const reviewedOn = '2026-10-11'
const claim = (textKey: string, ...sourceIds: string[]) => ({
  textKey: `l12:${textKey}`,
  sourceIds,
  reviewerRole,
  reviewedOn,
})

// All people, months, balances and rates are fictional assumptions, not recommendations.
const budgetLink = (promptKey: string, availableRupees: number) =>
  BudgetAllocatorConfigSchema.parse({
    titleKey: 'l12:budget.title',
    promptKey,
    hintKeys: ['l12:budget.hint1', 'l12:budget.hint2'],
    explanationKey: 'l12:budget.explanation',
    availablePaise: rupees(availableRupees),
    essentialsPaise: rupees(12_000),
    recurringCommitmentPaise: rupees(4_500),
    errors: { noEssentials: 'budget.no_essentials', noSavings: 'budget.no_savings' },
  })

const upiLink = (promptKey: string, payeeHandleKey: string) =>
  UpiPaymentConfigSchema.parse({
    titleKey: 'l12:upi.title',
    promptKey,
    hintKeys: ['l12:upi.hint1', 'l12:upi.hint2'],
    explanationKey: 'l12:upi.explanation',
    mode: 'pay',
    payeeNameKey: 'l12:upi.payeeName',
    payeeHandleKey,
    amountPaise: rupees(2_500),
    noteKey: 'l12:upi.note',
    choices: [
      {
        id: 'pay',
        labelKey: 'l12:upi.pay',
        action: 'enterPin',
        error: 'upi.wrong_payee',
        severity: 'major',
      },
      { id: 'decline', labelKey: 'l12:upi.decline', action: 'decline' },
    ],
    correctChoiceId: 'decline',
  })

const loanLink = (promptKey: string, principalRupees: number) =>
  OfferComparatorConfigSchema.parse({
    titleKey: 'l12:loan.title',
    promptKey,
    hintKeys: ['l12:loan.hint1', 'l12:loan.hint2'],
    explanationKey: 'l12:loan.explanation',
    offers: [
      {
        id: 'twelve-months',
        labelKey: 'l12:loan.twelveLabel',
        principalPaise: rupees(principalRupees),
        annualRatePct: 12,
        tenureMonths: 12,
        feesPaise: rupees(400),
        assumptionsKey: 'l12:loan.twelveAssumptions',
      },
      {
        id: 'thirty-six-months',
        labelKey: 'l12:loan.thirtySixLabel',
        principalPaise: rupees(principalRupees),
        annualRatePct: 12,
        tenureMonths: 36,
        feesPaise: rupees(400),
        assumptionsKey: 'l12:loan.thirtySixAssumptions',
        error: 'loan.ignored_total_cost',
        severity: 'major',
      },
    ],
    correctOfferId: 'twelve-months',
    budget: {
      incomePaise: rupees(30_000),
      rentPaise: rupees(8_000),
      essentialsPaise: rupees(12_000),
    },
  })

const savingsLink = (promptKey: string) =>
  TimeSliderConfigSchema.parse({
    titleKey: 'l12:savings.title',
    promptKey,
    hintKeys: ['l12:savings.hint1', 'l12:savings.hint2'],
    explanationKey: 'l12:savings.explanation',
    initialAmountPaise: rupees(5_000),
    annualRatePct: 6,
    annualInflationPct: 4,
    rangeSpreadPct: 2,
    maxYears: 3,
    error: 'investing.guaranteed_return',
    choices: [
      {
        id: 'promise',
        labelKey: 'l12:savings.promise',
        error: 'investing.guaranteed_return',
        severity: 'major',
      },
      { id: 'assumption', labelKey: 'l12:savings.assumption' },
    ],
    correctChoiceId: 'assumption',
  })

const fraudLink = (
  promptKey: string,
  message: {
    id: string
    channel: 'sms' | 'chat'
    senderKey: string
    bodyKey: string
    warningSigns: { id: string; labelKey: string }[]
    requiredWarningSignIds: string[]
    error: string
    severity: 'critical' | 'major' | 'minor'
  },
) =>
  MessageTriageConfigSchema.parse({
    titleKey: 'l12:fraud.title',
    promptKey,
    hintKeys: ['l12:fraud.hint1', 'l12:fraud.hint2'],
    explanationKey: 'l12:fraud.explanation',
    messages: [{ ...message, correctClassification: 'fraud' }],
  })

const otpFraud = {
  id: 'otp-request',
  channel: 'sms' as const,
  senderKey: 'l12:fraud.otpSender',
  bodyKey: 'l12:fraud.otpBody',
  warningSigns: [
    { id: 'urgency', labelKey: 'l12:fraud.sign.urgency' },
    { id: 'asksOtp', labelKey: 'l12:fraud.sign.asksOtp' },
    { id: 'unknownSender', labelKey: 'l12:fraud.sign.unknownSender' },
  ],
  requiredWarningSignIds: ['asksOtp', 'urgency'],
  error: 'fraud.shared_otp',
  severity: 'critical' as const,
}

const linkFraud = {
  id: 'prize-link',
  channel: 'chat' as const,
  senderKey: 'l12:fraud.linkSender',
  bodyKey: 'l12:fraud.linkBody',
  warningSigns: [
    { id: 'link', labelKey: 'l12:fraud.sign.link' },
    { id: 'prize', labelKey: 'l12:fraud.sign.prize' },
    { id: 'deadline', labelKey: 'l12:fraud.sign.deadline' },
  ],
  requiredWarningSignIds: ['link', 'prize'],
  error: 'fraud.clicked_link',
  severity: 'major' as const,
}

// A clean run scores 3 stars. The scripted mistake picks the long low-EMI loan in the Decision
// (loan.ignored_total_cost) and corrects it, then answers the Transfer correctly: 2 stars.
export const level = LevelDefSchema.parse({
  id: 'l12-capstone',
  skillNodes: ['money.independence'],
  location: 'home',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l12:hook.1', 'l12:hook.2', 'l12:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'formFiller',
      config: {
        titleKey: 'l12:lesson.title',
        fields: [
          {
            id: 'priority',
            labelKey: 'l12:lesson.priorityLabel',
            options: [
              { id: 'needs', labelKey: 'l12:lesson.needs' },
              { id: 'wants', labelKey: 'l12:lesson.wants' },
            ],
            correctOptionId: 'needs',
            error: 'loan.missed_payment',
          },
          {
            id: 'projection',
            labelKey: 'l12:lesson.projectionLabel',
            options: [
              { id: 'assumption', labelKey: 'l12:lesson.assumption' },
              { id: 'promise', labelKey: 'l12:lesson.promise' },
            ],
            correctOptionId: 'assumption',
            error: 'investing.guaranteed_return',
          },
        ],
      },
    },
    { id: 'travel', type: 'travel', location: 'home' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'scenarioChain',
      config: ScenarioChainConfigSchema.parse({
        titleKey: 'l12:decision.title',
        promptKey: 'l12:decision.prompt',
        hintKeys: ['l12:decision.hint1', 'l12:decision.hint2'],
        explanationKey: 'l12:decision.explanation',
        links: [
          { interaction: 'budgetAllocator', config: budgetLink('l12:budget.prompt', 30_000) },
          { interaction: 'upiPayment', config: upiLink('l12:upi.prompt', 'l12:upi.payeeHandle') },
          { interaction: 'offerComparator', config: loanLink('l12:loan.prompt', 40_000) },
          { interaction: 'timeSlider', config: savingsLink('l12:savings.prompt') },
        ],
      }),
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
      outcomeKeys: ['l12:consequence.month', 'l12:consequence.next'],
      explanationKey: 'l12:consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'meera-month',
          interaction: 'scenarioChain',
          config: ScenarioChainConfigSchema.parse({
            titleKey: 'l12:transfer.meera.title',
            promptKey: 'l12:transfer.meera.prompt',
            hintKeys: ['l12:transfer.hint1', 'l12:transfer.hint2'],
            explanationKey: 'l12:transfer.meera.explanation',
            links: [
              {
                interaction: 'budgetAllocator',
                config: budgetLink('l12:transfer.meera.budget', 28_000),
              },
              { interaction: 'messageTriage', config: fraudLink('l12:fraud.prompt', otpFraud) },
              {
                interaction: 'offerComparator',
                config: loanLink('l12:transfer.meera.loan', 30_000),
              },
              {
                interaction: 'timeSlider',
                config: savingsLink('l12:transfer.meera.savings'),
              },
            ],
          }),
        },
        {
          id: 'arjun-month',
          interaction: 'scenarioChain',
          config: ScenarioChainConfigSchema.parse({
            titleKey: 'l12:transfer.arjun.title',
            promptKey: 'l12:transfer.arjun.prompt',
            hintKeys: ['l12:transfer.hint1', 'l12:transfer.hint2'],
            explanationKey: 'l12:transfer.arjun.explanation',
            links: [
              {
                interaction: 'budgetAllocator',
                config: budgetLink('l12:transfer.arjun.budget', 32_000),
              },
              {
                interaction: 'offerComparator',
                config: loanLink('l12:transfer.arjun.loan', 50_000),
              },
              { interaction: 'messageTriage', config: fraudLink('l12:fraud.prompt', linkFraud) },
              {
                interaction: 'timeSlider',
                config: savingsLink('l12:transfer.arjun.savings'),
              },
            ],
          }),
        },
      ],
    },
  ],
  worldEffects: [{ key: 'curriculum.completed', value: 'true' }],
  claims: [
    ...[
      'hook.1',
      'hook.2',
      'lesson.needs',
      'lesson.assumption',
      'budget.hint1',
      'consequence.explanation',
      'transfer.hint1',
      'budget.no_essentials.review',
      'budget.no_savings.review',
    ].map((key) => claim(key, 'l12-ncfe-financial-planning')),
    ...[
      'hook.3',
      'lesson.projectionLabel',
      'savings.prompt',
      'savings.hint1',
      'savings.assumption',
      'consequence.month',
      'investing.guaranteed_return.review',
    ].map((key) => claim(key, 'l12-sebi-investment-factors', 'l12-rbi-financial-literacy')),
    ...['upi.prompt', 'upi.hint1', 'upi.hint2', 'upi.explanation', 'upi.wrong_payee.review'].map(
      (key) => claim(key, 'l12-npci-upi-safety'),
    ),
    ...[
      'fraud.prompt',
      'fraud.hint1',
      'fraud.explanation',
      'fraud.shared_otp.review',
      'fraud.clicked_link.review',
    ].map((key) => claim(key, 'l12-rbi-cyber-threats')),
    ...[
      'loan.prompt',
      'loan.hint1',
      'loan.hint2',
      'loan.twelveAssumptions',
      'loan.thirtySixAssumptions',
      'loan.ignored_total_cost.review',
    ].map((key) => claim(key, 'l12-rbi-kfs')),
  ],
})

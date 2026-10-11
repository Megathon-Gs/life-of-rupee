import {
  BudgetAllocatorConfigSchema,
  LevelDefSchema,
  ReceiptInspectorConfigSchema,
  ScenarioChainConfigSchema,
} from '@/core/contracts'

const rupees = (amount: number) => amount * 100
const reviewerRole = 'NGO educator (sign-off pending)'
const reviewedOn = '2026-10-11'
const claim = (textKey: string, ...sourceIds: string[]) => ({ textKey, sourceIds, reviewerRole, reviewedOn })

const errors = { missedTax: 'receipt.missed_tax', discountBeforeTax: 'receipt.discount_before_tax' }

// Every receipt number is derived by src/core/finance receiptTotals; content supplies only inputs.
// All shops, people, prices and tax rates are fictional assumptions, not real rates.
// The discount is taken off first and tax is worked out on the price after it (taxOnDiscounted).
const receipt = (
  scene: 'lesson' | 'decision' | 'transfer.stationery' | 'transfer.grocery',
  items: { id: string; unitPrice: number; quantity?: number }[],
  discount: number,
  taxRatePct: number,
) =>
  ReceiptInspectorConfigSchema.parse({
    titleKey: `l06:${scene}.title`,
    promptKey: `l06:${scene}.prompt`,
    hintKeys: [`l06:${scene}.hint1`, `l06:${scene}.hint2`],
    explanationKey: `l06:${scene}.explanation`,
    items: items.map(item => ({
      id: item.id,
      labelKey: `l06:${scene}.items.${item.id}`,
      unitPricePaise: rupees(item.unitPrice),
      ...(item.quantity ? { quantity: item.quantity } : {}),
    })),
    discountPaise: rupees(discount),
    taxRatePct,
    taxOnDiscounted: true,
    errors,
  })

const decisionItems = [
  { id: 'lentils', unitPrice: 90, quantity: 2 },
  { id: 'oil', unitPrice: 120 },
  { id: 'soap', unitPrice: 25, quantity: 4 },
]

// Budget follow-up (BudgetAllocator): Mina's fictional money for the month. Essentials are the
// receipt's amount payable (₹418, checked against receiptTotals in the test). When Level 9 has
// recorded loan.activeInstallment, a fictional fixed instalment is locked into needs. The amount
// is an assumption; the flag carries no amount.
const monthMoney = rupees(1_500)
const essentials = rupees(418)
const installment = rupees(500)
const budget = (commitment?: number) =>
  BudgetAllocatorConfigSchema.parse({
    titleKey: 'l06:budget.title',
    promptKey: commitment ? 'l06:budget.promptInstallment' : 'l06:budget.prompt',
    hintKeys: ['l06:budget.hint1', 'l06:budget.hint2'],
    explanationKey: 'l06:budget.explanation',
    availablePaise: monthMoney,
    essentialsPaise: essentials,
    ...(commitment ? { recurringCommitmentPaise: commitment } : {}),
    errors: { noEssentials: 'budget.no_essentials', noSavings: 'budget.no_savings' },
  })

const decisionChain = (commitment?: number) =>
  ScenarioChainConfigSchema.parse({
    titleKey: 'l06:chain.title',
    promptKey: 'l06:chain.prompt',
    hintKeys: ['l06:chain.hint1', 'l06:chain.hint2'],
    explanationKey: 'l06:chain.explanation',
    links: [
      { interaction: 'receiptInspector', config: receipt('decision', decisionItems, 20, 10) },
      { interaction: 'budgetAllocator', config: budget(commitment) },
    ],
  })

// P2-12 mistake path: tap the subtotal (tag prices added up) as the amount to pay in the decision
// (receipt.discount_before_tax), correct to the total line, finish the budget, then answer the
// transfer correctly. One major error earns 2 stars; a clean run earns 3.
// The decision is a ScenarioChain: ReceiptInspector, then the BudgetAllocator follow-up. When
// loan.activeInstallment is 'true' the chain's budget link shows the fictional instalment as a
// fixed commitment (product plan section 8); otherwise no loan is invented.
export const level = LevelDefSchema.parse({
  id: 'l06-receipts',
  skillNodes: ['money.spending'],
  location: 'market',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l06:hook.1', 'l06:hook.2', 'l06:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'receiptInspector',
      config: receipt('lesson', [{ id: 'notebook', unitPrice: 45, quantity: 4 }, { id: 'bottle', unitPrice: 120 }], 30, 10),
    },
    { id: 'travel', type: 'travel', location: 'market' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'scenarioChain',
      config: decisionChain(),
      configOverrides: [
        { when: { flag: 'loan.activeInstallment', equals: 'true' }, config: decisionChain(installment) },
      ],
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
      outcomeKeys: ['l06:consequence.tags', 'l06:consequence.total', 'l06:consequence.budget'],
      explanationKey: 'l06:consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'stationery-discount-before-tax',
          interaction: 'receiptInspector',
          config: receipt(
            'transfer.stationery',
            [
              { id: 'notebook', unitPrice: 50, quantity: 4 },
              { id: 'geometry', unitPrice: 150 },
              { id: 'bag', unitPrice: 250 },
            ],
            100,
            18,
          ),
        },
        {
          id: 'grocery-discount-before-tax',
          interaction: 'receiptInspector',
          config: receipt(
            'transfer.grocery',
            [
              { id: 'flour', unitPrice: 40, quantity: 5 },
              { id: 'sugar', unitPrice: 45, quantity: 2 },
              { id: 'tea', unitPrice: 110 },
            ],
            40,
            5,
          ),
        },
      ],
    },
  ],
  worldEffects: [],
  claims: [
    claim('l06:claim.invoiceLines', 'cbic-cgst-rule-46'),
    claim('l06:claim.discountValue', 'cbic-cgst-section-15'),
    claim('l06:claim.askForBill', 'ncfe-class-6-bill'),
    claim('l06:claim.indirectTax', 'ncfe-class-6-bill'),
    claim('l06:claim.budget', 'ncfe-personal-finance-school'),
    claim('l06:receipt.discount_before_tax.review', 'cbic-cgst-rule-46', 'cbic-cgst-section-15', 'ncfe-class-6-bill'),
    claim('l06:receipt.missed_tax.review', 'cbic-cgst-rule-46', 'ncfe-class-6-bill'),
    claim('l06:budget.no_essentials.review', 'ncfe-personal-finance-school'),
    claim('l06:budget.no_savings.review', 'ncfe-personal-finance-school'),
  ],
})

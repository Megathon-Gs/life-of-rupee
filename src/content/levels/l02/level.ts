import { LevelDefSchema } from '@/core/contracts'

// P0-23 mistake path: choose 'adult' for accountRoute, correct it to 'minor',
// then answer the transfer correctly. The one account-route error earns 2 stars; a clean run earns 3.
export const level = LevelDefSchema.parse({
  id: 'l02-bank-account',
  skillNodes: ['bank.account'],
  location: 'bank',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l02:hook.1', 'l02:hook.2', 'l02:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'documentInspector',
      config: {
        titleKey: 'l02:lesson.title',
        promptKey: 'l02:lesson.prompt',
        fields: [
          { id: 'document', labelKey: 'l02:lesson.documentLabel', valueKey: 'l02:lesson.documentValue', isAnswer: true },
          { id: 'schoolCard', labelKey: 'l02:lesson.schoolCardLabel', valueKey: 'l02:lesson.schoolCardValue', isAnswer: false, error: 'kyc.wrong_document' },
        ],
      },
    },
    { id: 'travel', type: 'travel', location: 'bank' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'formFiller',
      config: {
        titleKey: 'l02:decision.title',
        fields: [
          {
            id: 'accountRoute', labelKey: 'l02:decision.routeLabel',
            options: [
              { id: 'adult', labelKey: 'l02:decision.adult' },
              { id: 'minor', labelKey: 'l02:decision.minor' },
            ],
            correctOptionId: 'minor', error: 'bank.wrong_document',
          },
          {
            id: 'identity', labelKey: 'l02:decision.identityLabel',
            options: [
              { id: 'passport', labelKey: 'l02:decision.passport' },
              { id: 'aadhaarOnly', labelKey: 'l02:decision.aadhaarOnly' },
            ],
            correctOptionId: 'passport', error: 'kyc.wrong_document',
          },
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
    { id: 'consequence', type: 'consequence', outcomeKeys: ['l02:consequence.opened'], explanationKey: 'l02:consequence.explanation' },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'tara-minor-account', interaction: 'formFiller',
          config: {
            titleKey: 'l02:transfer.tara.title',
            fields: [
              {
                id: 'accountRoute', labelKey: 'l02:decision.routeLabel',
                options: [
                  { id: 'adult', labelKey: 'l02:decision.adult' },
                  { id: 'minor', labelKey: 'l02:decision.minor' },
                ],
                correctOptionId: 'minor', error: 'bank.wrong_document',
              },
              {
                id: 'identity', labelKey: 'l02:decision.identityLabel',
                options: [
                  { id: 'schoolCard', labelKey: 'l02:transfer.schoolCard' },
                  { id: 'passport', labelKey: 'l02:transfer.tara.passport' },
                ],
                correctOptionId: 'passport', error: 'kyc.wrong_document',
              },
            ],
          },
        },
        {
          id: 'arun-adult-account', interaction: 'formFiller',
          config: {
            titleKey: 'l02:transfer.arun.title',
            fields: [
              {
                id: 'accountRoute', labelKey: 'l02:decision.routeLabel',
                options: [
                  { id: 'adult', labelKey: 'l02:decision.adult' },
                  { id: 'minor', labelKey: 'l02:decision.minor' },
                ],
                correctOptionId: 'adult', error: 'bank.wrong_document',
              },
              {
                id: 'identity', labelKey: 'l02:decision.identityLabel',
                options: [
                  { id: 'voterId', labelKey: 'l02:transfer.arun.voterId' },
                  { id: 'aadhaarOnly', labelKey: 'l02:decision.aadhaarOnly' },
                ],
                correctOptionId: 'voterId', error: 'kyc.wrong_document',
              },
            ],
          },
        },
      ],
    },
  ],
  worldEffects: [{ key: 'bank.accountOpened', value: 'true' }],
  claims: [
    { textKey: 'l02:claim.documents', sourceIds: ['rbi-kyc-master-direction'], reviewerRole: 'NGO educator (user approval)', reviewedOn: '2026-10-10' },
    { textKey: 'l02:claim.aadhaar', sourceIds: ['rbi-kyc-master-direction'], reviewerRole: 'NGO educator (user approval)', reviewedOn: '2026-10-10' },
    { textKey: 'l02:claim.minors', sourceIds: ['rbi-kyc-master-direction'], reviewerRole: 'NGO educator (user approval)', reviewedOn: '2026-10-10' },
    { textKey: 'l02:hook.2', sourceIds: ['rbi-minor-deposit-accounts'], reviewerRole: 'NGO educator (user approval)', reviewedOn: '2026-10-10' },
    { textKey: 'l02:decision.minor', sourceIds: ['rbi-minor-deposit-accounts'], reviewerRole: 'NGO educator (user approval)', reviewedOn: '2026-10-10' },
    { textKey: 'l02:kyc.wrong_document.review', sourceIds: ['rbi-kyc-master-direction'], reviewerRole: 'NGO educator (user approval)', reviewedOn: '2026-10-10' },
    { textKey: 'l02:bank.wrong_document.review', sourceIds: ['rbi-minor-deposit-accounts'], reviewerRole: 'NGO educator (user approval)', reviewedOn: '2026-10-10' },
  ],
})

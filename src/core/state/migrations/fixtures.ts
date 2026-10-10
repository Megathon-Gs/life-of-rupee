/** Released-version fixture saves; add one per schema version when it ships. */
export const v1Fixture = {
  schemaVersion: 1,
  learner: { localId: '00000000-0000-4000-8000-000000000001' },
  settings: {
    locale: 'en',
    reducedMotion: 'system',
    muted: false,
    textScale: 1,
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  position: { locationId: 'home' },
  attempts: [
    {
      id: 'a1',
      levelId: 'l02-bank-account',
      contentVersion: '1',
      startedAt: '2026-01-01T00:01:00.000Z',
      endedAt: '2026-01-01T00:05:00.000Z',
      stars: 2,
      errors: ['bank.wrong_document'],
      hints: 1,
      worldChoices: { vehicle: 'bicycle' },
    },
  ],
  seen: ['intro'],
} as const

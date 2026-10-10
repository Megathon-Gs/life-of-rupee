import { describe, expect, it } from 'vitest'
import { InLevelSnapshotSchema, SaveFileSchema, type InLevelSnapshot } from './index'

const snapshot = { levelId: 'l09-loans', stepIndex: 1, events: [] }

describe('saved P1 condition results', () => {
  it('preserves legacy snapshots without adding metadata', () => {
    expect(InLevelSnapshotSchema.parse(snapshot)).toEqual(snapshot)
  })

  it('round-trips true and false start-time decisions in a save', () => {
    const inLevel: InLevelSnapshot = InLevelSnapshotSchema.parse({
      ...snapshot,
      conditionResults: { 'fraud-callback': false, 'loan-warning': true },
    })
    const save = {
      schemaVersion: 1,
      learner: { localId: 'fictional-profile' },
      settings: {
        locale: 'en',
        reducedMotion: 'system',
        muted: false,
        textScale: 1,
        updatedAt: '2026-10-10T00:00:00Z',
      },
      position: { locationId: 'showroom', inLevel },
      attempts: [],
      seen: [],
    }
    const restored = SaveFileSchema.parse(JSON.parse(JSON.stringify(save)))
    expect(restored.position.inLevel?.conditionResults).toEqual(inLevel.conditionResults)
  })

  it('accepts an empty decision map for a level with no conditions', () => {
    expect(
      InLevelSnapshotSchema.parse({ ...snapshot, conditionResults: {} }).conditionResults,
    ).toEqual({})
  })

  it.each([null, [], true, { callback: 'false' }, { callback: 0 }, { '': false }])(
    'rejects malformed condition results: %j',
    (conditionResults) => {
      expect(InLevelSnapshotSchema.safeParse({ ...snapshot, conditionResults }).success).toBe(false)
    },
  )

  it('still rejects unrelated snapshot metadata', () => {
    expect(
      InLevelSnapshotSchema.safeParse({ ...snapshot, conditionResults: {}, name: 'private' })
        .success,
    ).toBe(false)
  })
})

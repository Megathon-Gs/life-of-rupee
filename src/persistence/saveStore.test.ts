import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SaveFile } from '../core/contracts'
import { db } from './db'
import { createSaveStore } from './saveStore'

const identity = (value: unknown) => value as SaveFile
const sample = (locationId = 'home'): SaveFile => ({
  schemaVersion: 1,
  learner: { localId: 'learner-1' },
  settings: { locale: 'en', reducedMotion: 'system', muted: false, textScale: 1, updatedAt: '2026-10-10T00:00:00.000Z' },
  position: { locationId: locationId as SaveFile['position']['locationId'] },
  attempts: [],
  seen: [],
})

describe('IndexedDB save store', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })
  afterEach(async () => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    await db.delete()
  })

  it('persists deeply equal saves across store instances and debounces writes', async () => {
    const store = createSaveStore({ migrate: identity })
    const profile = await store.createProfile()
    const put = vi.spyOn(db.saves, 'put')
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    for (let i = 0; i < 50; i++) {
      await store.save({ ...sample(`place-${i}`), learner: profile.learner })
      if (i < 49) vi.advanceTimersByTime(5)
    }
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(299)
    expect(put).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    // IndexedDB uses its own scheduling; restore real timers before awaiting the transaction.
    vi.useRealTimers()
    await store.flush()
    expect(put).toHaveBeenCalledTimes(1)
    expect(await createSaveStore({ migrate: identity }).load(profile.learner.localId)).toEqual({
      ...sample('place-49'),
      learner: profile.learner,
    })
  })

  it('flushes immediately and quarantines a corrupt save, restoring the previous snapshot', async () => {
    const store = createSaveStore({ migrate: identity })
    const profile = await store.createProfile()
    await store.save({ ...sample('first'), learner: profile.learner })
    await store.flush()
    await store.save({ ...sample('second'), learner: profile.learner })
    await store.flush()
    await db.saves.put({ localId: profile.learner.localId, file: { broken: true } as never, updatedAt: Date.now() })
    expect(await store.load(profile.learner.localId)).toEqual({ ...sample('first'), learner: profile.learner })
    expect(await db.quarantine.where('localId').equals(profile.learner.localId).count()).toBe(1)
  })

  it('removes a profile and all of its persisted rows', async () => {
    const store = createSaveStore({ migrate: identity })
    await store.createProfile()
    const profile = (await store.listProfiles())[0]!
    await store.save({ ...sample(), learner: { localId: profile.localId } })
    await store.flush()
    await store.removeProfile(profile.localId)
    expect(await db.profiles.count()).toBe(0)
    expect(await db.saves.count()).toBe(0)
    expect(await db.snapshots.count()).toBe(0)
    expect(await db.quarantine.count()).toBe(0)
  })

  it('quarantines another profile’s save and skips its snapshots', async () => {
    const store = createSaveStore({ migrate: identity })
    const first = await store.createProfile()
    const second = await store.createProfile()
    const localId = first.learner.localId
    await db.snapshots.add({ localId, file: first, createdAt: Date.now() })
    await db.snapshots.add({ localId, file: second, createdAt: Date.now() })
    await db.saves.put({ localId, file: second, updatedAt: Date.now() })

    expect(await store.load(localId)).toEqual(first)
    expect((await db.quarantine.where('localId').equals(localId).toArray())[0]?.value).toEqual(second)
    expect(await db.saves.get(localId)).toBeUndefined()
    await db.snapshots.where('localId').equals(localId).delete()
    await db.snapshots.add({ localId, file: second, createdAt: Date.now() })
    expect(await store.load(localId)).toBeUndefined()
  })

  it('checks profile identity after migration', async () => {
    const first = await createSaveStore({ migrate: identity }).createProfile()
    const store = createSaveStore({ migrate: (value) => ({ ...identity(value), learner: { localId: 'other-profile' } }) })
    expect(await store.load(first.learner.localId)).toBeUndefined()
    expect(await db.quarantine.where('localId').equals(first.learner.localId).count()).toBe(1)
  })

  it('does not recreate a removed profile from a pending save', async () => {
    const store = createSaveStore({ migrate: identity })
    const staleStore = createSaveStore({ migrate: identity })
    const file = await store.createProfile()
    const activeTimers = new Map<number, () => void>()
    let nextTimerId = 0
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: TimerHandler) => {
      const id = ++nextTimerId
      activeTimers.set(id, callback as () => void)
      return id as ReturnType<typeof setTimeout>
    }) as typeof setTimeout)
    vi.spyOn(globalThis, 'clearTimeout').mockImplementation((id) => { activeTimers.delete(id as number) })
    await staleStore.save(file)
    await store.removeProfile(file.learner.localId)
    vi.restoreAllMocks()
    activeTimers.values().next().value?.()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(await db.profiles.count()).toBe(0)
    expect(await db.saves.count()).toBe(0)
    expect(await db.snapshots.count()).toBe(0)
  })

  it('debounces each profile independently', async () => {
    const store = createSaveStore({ migrate: identity })
    const first = await store.createProfile()
    const second = await store.createProfile()
    await store.save({ ...first, position: { locationId: 'first-place' as SaveFile['position']['locationId'] } })
    await store.save({ ...second, position: { locationId: 'second-place' as SaveFile['position']['locationId'] } })
    await store.flush()
    expect((await store.load(first.learner.localId))?.position.locationId).toBe('first-place')
    expect((await store.load(second.learner.localId))?.position.locationId).toBe('second-place')
  })

  it('continues writing after a failed transaction', async () => {
    const store = createSaveStore({ migrate: identity })
    const file = await store.createProfile()
    const transaction = vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('temporary storage failure'))
    await store.save(file)
    await expect(store.flush()).rejects.toThrow('temporary storage failure')
    transaction.mockRestore()
    await store.save({ ...file, position: { locationId: 'market' as SaveFile['position']['locationId'] } })
    await store.flush()
    expect((await db.saves.get(file.learner.localId))?.file.position.locationId).toBe('market')
  })

  it('does not use the network', async () => {
    const fetch = vi.fn(() => { throw new Error('unexpected network request') })
    vi.stubGlobal('fetch', fetch)
    const store = createSaveStore({ migrate: identity })
    const file = await store.createProfile()
    await store.save(file)
    await store.flush()
    await store.load(file.learner.localId)
    expect(fetch).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('keeps exactly the three newest snapshots per profile', async () => {
    const store = createSaveStore({ migrate: identity })
    const first = await store.createProfile()
    const second = await store.createProfile()
    for (const file of [first, second]) {
      for (let i = 0; i < 5; i++) {
        await store.save({ ...file, position: { locationId: `place-${i}` as SaveFile['position']['locationId'] } })
        await store.flush()
      }
      const snapshots = await db.snapshots.where('localId').equals(file.learner.localId).toArray()
      expect(snapshots.map((row) => row.file.position.locationId)).toEqual(['place-1', 'place-2', 'place-3'])
    }
  })

  it('falls back past snapshots that fail migration', async () => {
    const original = createSaveStore({ migrate: identity })
    const file = await original.createProfile()
    const localId = file.learner.localId
    await db.snapshots.add({ localId, file, createdAt: Date.now() })
    const unsupported = { ...file, schemaVersion: 99 }
    await db.snapshots.add({ localId, file: unsupported, createdAt: Date.now() })
    await db.saves.put({ localId, file: unsupported, updatedAt: Date.now() })
    const store = createSaveStore({ migrate: (value) => {
      if (identity(value).schemaVersion === 99) throw new Error('unsupported version')
      return identity(value)
    } })
    expect(await store.load(localId)).toEqual(file)
    expect((await db.quarantine.where('localId').equals(localId).toArray())[0]?.value).toEqual(unsupported)
  })

  it('rolls back profile creation when its initial save fails', async () => {
    const store = createSaveStore({ migrate: identity })
    vi.spyOn(db.saves, 'put').mockRejectedValueOnce(new Error('storage unavailable'))
    await expect(store.createProfile()).rejects.toThrow('storage unavailable')
    expect(await store.listProfiles()).toEqual([])
    expect(await db.saves.count()).toBe(0)
  })

  it('preserves a failed write so flush can retry without another state change', async () => {
    const store = createSaveStore({ migrate: identity })
    const file = await store.createProfile()
    const changed = { ...file, seen: ['bank-entry'] }
    vi.spyOn(db.saves, 'put').mockRejectedValueOnce(new Error('temporary storage failure'))
    await store.save(changed)
    await expect(store.flush()).rejects.toThrow('temporary storage failure')
    await expect(store.flush()).resolves.toBeUndefined()
    expect(await store.load(file.learner.localId)).toEqual(changed)
  })

  it('does not replace newer pending data when an older write fails', async () => {
    const store = createSaveStore({ migrate: identity })
    const file = await store.createProfile()
    let rejectWrite!: (error: Error) => void
    let started!: () => void
    const writing = new Promise<void>((resolve) => { started = resolve })
    vi.spyOn(db.saves, 'put').mockImplementationOnce(() => {
      started()
      return new Dexie.Promise<string>((_, reject) => { rejectWrite = reject })
    })
    await store.save({ ...file, seen: ['older'] })
    const failed = expect(store.flush()).rejects.toThrow('temporary storage failure')
    await writing
    const newer = { ...file, seen: ['newer'] }
    await store.save(newer)
    rejectWrite(new Error('temporary storage failure'))
    await failed
    await store.flush()
    expect(await store.load(file.learner.localId)).toEqual(newer)
  })

  it('does not delete a newer save while quarantining an older corrupt save', async () => {
    const original = createSaveStore({ migrate: identity })
    const file = await original.createProfile()
    const localId = file.learner.localId
    await db.saves.put({ localId, file: { broken: true } as never, updatedAt: Date.now() })
    let rejectMigration!: (error: Error) => void
    let started!: () => void
    let migrationStarted = false
    const migrating = new Promise<void>((resolve) => { started = resolve })
    const recovery = createSaveStore({ migrate: (value) => {
      if (!('broken' in (value as object))) return identity(value)
      if (migrationStarted) throw new Error('corrupt snapshot')
      migrationStarted = true
      started()
      return new Promise<SaveFile>((_, reject) => { rejectMigration = reject })
    } })
    const loading = recovery.load(localId)
    await migrating
    const newer = { ...file, seen: ['bank-entry'] }
    await original.save(newer)
    await original.flush()
    rejectMigration(new Error('corrupt save'))
    expect(await loading).toEqual(newer)
    expect((await db.saves.get(localId))?.file).toEqual(newer)
  })
})

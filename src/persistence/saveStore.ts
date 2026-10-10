import { SaveFileSchema, type SaveFile, type SaveStore } from '../core/contracts'
import { db } from './db'

export type SaveMigrator = (file: unknown) => SaveFile | Promise<SaveFile>

export function createSaveStore({ migrate }: { migrate: SaveMigrator }): SaveStore {
  const pending = new Map<string, SaveFile>()
  const latest = new Map<string, SaveFile>()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  let writing = Promise.resolve()

  const validate = async (value: unknown, localId: string) => {
    const file = SaveFileSchema.parse(await migrate(value))
    if (file.learner.localId !== localId) throw new Error('Save belongs to another profile')
    return file
  }

  const write = (file: SaveFile) => {
    const copy = structuredClone(file)
    writing = writing.catch(() => {}).then(() => db.transaction('rw', db.profiles, db.saves, db.snapshots, async () => {
      if (!(await db.profiles.get(copy.learner.localId))) return
      const now = Date.now()
      const previous = await db.saves.get(copy.learner.localId)
      await db.snapshots.add({ localId: copy.learner.localId, file: previous?.file ?? copy, createdAt: now })
      await db.saves.put({ localId: copy.learner.localId, file: copy, updatedAt: now, revision: crypto.randomUUID() })
      const rows = (await db.snapshots.where('localId').equals(copy.learner.localId).toArray()).sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
      await db.snapshots.bulkDelete(rows.slice(3).map((row) => row.id!))
    })).then(() => {
      if (latest.get(copy.learner.localId) === file) latest.delete(copy.learner.localId)
    }).catch((error: unknown) => {
      if (latest.get(copy.learner.localId) === file) pending.set(copy.learner.localId, file)
      throw error
    })
    return writing
  }

  return {
    async save(file) {
      const localId = file.learner.localId
      const copy = structuredClone(file)
      pending.set(localId, copy)
      latest.set(localId, copy)
      const timer = timers.get(localId)
      if (timer) clearTimeout(timer)
      timers.set(localId, setTimeout(() => {
        timers.delete(localId)
        const next = pending.get(localId)
        pending.delete(localId)
        if (next) void write(next).catch(() => {})
      }, 300))
    },
    async flush() {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
      const next = [...pending.values()]
      pending.clear()
      if (next.length) await Promise.all(next.map(write))
      else await writing
    },
    load: async function load(localId): Promise<SaveFile | undefined> {
      const row = await db.saves.get(localId)
      if (row) {
        try {
          return await validate(row.file, localId)
        } catch {
          const changed = await db.transaction('rw', db.saves, db.quarantine, async () => {
            const current = await db.saves.get(localId)
            if (!current) return false
            if (current.revision !== row.revision || current.updatedAt !== row.updatedAt) return true
            await db.quarantine.add({ localId, value: row.file, quarantinedAt: Date.now() })
            await db.saves.delete(localId)
            return false
          })
          if (changed) return load(localId)
        }
      }
      const snapshots = (await db.snapshots.where('localId').equals(localId).toArray()).sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
      for (const snapshot of snapshots) {
        try {
          return await validate(snapshot.file, localId)
        } catch {
          // Skip corrupt snapshots and continue to the newest valid one.
        }
      }
      return undefined
    },
    async listProfiles() {
      return (await db.profiles.toArray()).map(({ localId, avatar, displayName }) => ({ localId, avatar, displayName }))
    },
    async createProfile() {
      const localId = crypto.randomUUID()
      const avatar = 'player'
      const displayName = `${words[Math.floor(Math.random() * words.length)]} ${words[Math.floor(Math.random() * words.length)]}`
      const file: SaveFile = {
        schemaVersion: 1,
        learner: { localId },
        settings: { locale: 'en', reducedMotion: 'system', muted: false, textScale: 1, updatedAt: new Date().toISOString() },
        position: { locationId: 'home' as SaveFile['position']['locationId'] },
        attempts: [],
        seen: [],
      }
      await db.transaction('rw', db.profiles, db.saves, async () => {
        await db.profiles.add({ localId, avatar, displayName, createdAt: Date.now() })
        await db.saves.put({ localId, file, updatedAt: Date.now(), revision: crypto.randomUUID() })
      })
      return file
    },
    async removeProfile(localId) {
      const timer = timers.get(localId)
      if (timer) clearTimeout(timer)
      timers.delete(localId)
      pending.delete(localId)
      latest.delete(localId)
      await db.transaction('rw', db.profiles, db.saves, db.snapshots, db.quarantine, async () => {
        await Promise.all([
          db.profiles.delete(localId),
          db.saves.delete(localId),
          db.snapshots.where('localId').equals(localId).delete(),
          db.quarantine.where('localId').equals(localId).delete(),
        ])
      })
    },
  }
}

const words = ['Blue', 'Bright', 'Calm', 'Clever', 'Golden', 'Kind', 'Lucky', 'Silver', 'Swift', 'Tiny', 'Kite', 'Mango', 'River', 'Tiger', 'Tulip', 'Wren']

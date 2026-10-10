import type { AttemptRecord, SaveFile } from '../contracts'

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Canonical attempt order: by end time, then id. */
export const compareAttempts = (a: AttemptRecord, b: AttemptRecord): number =>
  cmp(a.endedAt, b.endedAt) || cmp(a.id, b.id)

const latestKey = (s: SaveFile): string => {
  const last = [...s.attempts].sort(compareAttempts).at(-1)
  return last ? `${last.endedAt}\u0000${last.id}` : ''
}

/** Order two saves deterministically so merge does not depend on argument order. */
const pickLater = (a: SaveFile, b: SaveFile): SaveFile => {
  const c = cmp(latestKey(a), latestKey(b)) || cmp(JSON.stringify(a), JSON.stringify(b))
  return c >= 0 ? a : b
}

const laterSettings = (a: SaveFile['settings'], b: SaveFile['settings']) => {
  const c = cmp(a.updatedAt, b.updatedAt) || cmp(JSON.stringify(a), JSON.stringify(b))
  return c >= 0 ? a : b
}

/** Merge two devices' saves: union of attempts by id, last-writer-wins settings, latest position. */
export function merge(a: SaveFile, b: SaveFile): SaveFile {
  const byId = new Map<string, AttemptRecord>()
  for (const x of [...a.attempts, ...b.attempts]) {
    const prev = byId.get(x.id)
    if (!prev || cmp(JSON.stringify(x), JSON.stringify(prev)) > 0) byId.set(x.id, x)
  }
  const base = pickLater(a, b)
  const syncCodes = [a.learner.syncCode, b.learner.syncCode].filter((c) => c !== undefined)
  const syncCode = base.learner.syncCode ?? syncCodes.sort(cmp).at(-1)
  return {
    schemaVersion: Math.max(a.schemaVersion, b.schemaVersion),
    learner:
      syncCode === undefined
        ? { localId: base.learner.localId }
        : { localId: base.learner.localId, syncCode },
    settings: laterSettings(a.settings, b.settings),
    position: base.position,
    attempts: [...byId.values()].sort(compareAttempts),
    seen: [...new Set([...a.seen, ...b.seen])].sort(cmp),
  }
}

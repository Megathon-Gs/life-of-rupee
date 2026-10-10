import type { LevelDef } from '@/core/contracts'

// JSON with object keys sorted, so key order in the source file never changes the hash.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
}

// 32-bit FNV-1a over UTF-16 code units.
function fnv1a(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Stable hash of a level's content, stored on every attempt so edits are detectable. */
export function contentVersion(level: LevelDef): string {
  return fnv1a(stableStringify(level)).toString(16).padStart(8, '0')
}

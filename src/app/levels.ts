import type { LevelDef, LocationId } from '@/core/contracts'
import { levels as contentLevels } from '@/content/levels'
import type { AppMode } from './mode'

/** Real levels, plus test fixtures for locations no real level covers (test mode only). */
export function mergeLevels(
  real: readonly LevelDef[],
  fixtures: readonly LevelDef[],
  fixturesOnly: boolean,
): LevelDef[] {
  if (fixturesOnly) return [...fixtures]
  const covered = new Set(real.map((level) => level.location as string))
  return [...real, ...fixtures.filter((level) => !covered.has(level.location))]
}

/** Levels for this launch; fixtures are loaded lazily so they stay out of the main chunk. */
export async function loadLevels(mode: AppMode): Promise<LevelDef[]> {
  if (!mode.test) return [...contentLevels]
  const { fixtureLevels } = await import('../../tests/e2e/fixtures/levels')
  return mergeLevels(contentLevels, fixtureLevels, mode.fixturesOnly)
}

/** The level played at a location, if the location is unlocked and has one. */
export function levelAt(
  levels: readonly LevelDef[],
  id: LocationId,
  unlocked: readonly LocationId[],
): LevelDef | undefined {
  if (!unlocked.includes(id)) return undefined
  return levels.find((level) => level.location === id)
}

/** The i18n namespace a level's strings live in, read from its first hook key ('l02:hook.1'). */
export function levelNamespace(level: LevelDef): string {
  const key = level.steps[0].lineKeys[0] ?? ''
  const colon = key.indexOf(':')
  return colon > 0 ? key.slice(0, colon) : 'common'
}

/** Stable per-attempt transfer seed: a retry draws a new variant, a reload keeps the same one. */
export function attemptSeed(localId: string, levelId: string, attemptNumber: number): number {
  let hash = 2166136261
  for (const char of `${localId}:${levelId}:${attemptNumber}`) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  }
  return hash >>> 0
}

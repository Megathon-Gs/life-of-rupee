import type {
  Derived,
  LevelDef,
  LevelId,
  LocationDef,
  SaveFile,
  SkillNodeId,
  Stars,
} from '../contracts'
import { compareAttempts } from './merge'

/** A location, optionally gated on completing levels. */
export type StateLocationDef = LocationDef & { unlockedBy?: readonly LevelId[] }

/** The slice of content `derive` needs. */
export interface DeriveContent {
  levels: readonly LevelDef[]
  locations: readonly StateLocationDef[]
}

/** World-choice key whose integer-paise value is added to the fictional wallet. */
export const WALLET_DELTA_KEY = 'wallet.delta'

/** An attempt counts as completing a level when it earned at least one star. */
const isCompleted = (stars: Stars) => stars >= 1

/** Recompute stars, skills, locations, world flags and wallet from the attempt log. */
export function derive(save: SaveFile, content: DeriveContent): Derived {
  const levels = new Map(content.levels.map((l) => [l.id as string, l]))
  const attempts = [...save.attempts].sort(compareAttempts)

  const bestStars: Record<string, Stars> = {}
  const firstStars: Record<string, Stars> = {}
  const completed = new Set<string>()
  const skills = new Set<SkillNodeId>()
  const worldFlags: Record<string, string> = {}
  let wallet = 0

  for (const a of attempts) {
    const id = a.levelId as string
    if (!(id in firstStars)) firstStars[id] = a.stars
    if (!(id in bestStars) || a.stars > bestStars[id]!) bestStars[id] = a.stars
    if (!isCompleted(a.stars)) continue
    completed.add(id)
    const level = levels.get(id)
    for (const s of level?.skillNodes ?? []) skills.add(s)
    for (const e of level?.worldEffects ?? []) worldFlags[e.key] = e.value
    for (const [k, v] of Object.entries(a.worldChoices)) {
      if (k === WALLET_DELTA_KEY) {
        const n = Number(v)
        if (Number.isInteger(n)) wallet += n
      } else worldFlags[k] = v
    }
  }

  const unlockedLocations = content.locations
    .filter((l) => (l.unlockedBy ?? []).every((id) => completed.has(id)))
    .map((l) => l.id)

  return { bestStars, firstStars, skills: [...skills], unlockedLocations, worldFlags, wallet }
}

import type { LevelDef } from '@/core/contracts'
import { level as l02 } from './l02/level'
import { level as l04 } from './l04/level'
import { level as l05 } from './l05/level'
import { level as l09 } from './l09/level'

/** Registry of all level definitions, in curriculum order. */
export const levels: LevelDef[] = [l02, l04, l05, l09]

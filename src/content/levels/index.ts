import type { LevelDef } from '@/core/contracts'
import { level as l01 } from './l01/level'
import { level as l02 } from './l02/level'
import { level as l03 } from './l03/level'
import { level as l04 } from './l04/level'
import { level as l05 } from './l05/level'
import { level as l06 } from './l06/level'
import { level as l07 } from './l07/level'
import { level as l08 } from './l08/level'
import { level as l09 } from './l09/level'
import { level as l10 } from './l10/level'
import { level as l11 } from './l11/level'
import { level as l12 } from './l12/level'

/** Registry of all level definitions, in curriculum order. */
export const levels: LevelDef[] = [l01, l02, l03, l04, l05, l06, l07, l08, l09, l10, l11, l12]

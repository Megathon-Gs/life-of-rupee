import type { LevelDef } from './content'
import type { InteractionEvent } from './events'
import type { InLevelSnapshot, AttemptRecord } from './save'
import type { ScoreResult } from './scoring'

/** Source of ISO timestamps, injected so the runner stays deterministic. */
export type Clock = () => string

/** The runner's current position within a level. */
export interface RunnerState {
  levelId: LevelDef['id']
  stepIndex: number
  events: InteractionEvent[]
  done: boolean
}

/** What the runner reports when a level finishes. */
export interface LevelCompletion {
  attempt: AttemptRecord
  score: ScoreResult
}

/** Level runner contract: walks a level's steps and collects events. */
export interface LevelRunner {
  start(level: LevelDef, seed: number, now: Clock): void
  resume(snapshot: InLevelSnapshot): void
  current(): RunnerState
  dispatch(event: InteractionEvent): void
  onComplete(cb: (completion: LevelCompletion) => void): void
}

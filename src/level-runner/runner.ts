import type {
  AttemptRecord,
  Clock,
  ErrorCategory,
  InLevelSnapshot,
  InteractionEvent,
  InteractionId,
  LevelCompletion,
  LevelDef,
  LevelRunner,
  LocationId,
  RunnerState,
} from '@/core/contracts'
import { score } from '@/core/scoring'
import { contentVersion } from './contentVersion'
import { pickIndex } from './prng'

/** Runner-only inputs that are not scored and never enter the event log. */
export type RunnerSignal =
  { kind: 'arrivedAt'; locationId: LocationId } | { kind: 'continue' } | { kind: 'interactionDone' }

/** Everything `dispatch` accepts: scored interaction events plus runner signals. */
export type RunnerInput = InteractionEvent | RunnerSignal

/** What the UI must render for the active step. */
export type StepView =
  | { type: 'hook'; stepId: string; lineKeys: string[] }
  | { type: 'lesson'; stepId: string; interaction: InteractionId; config: unknown }
  | { type: 'travel'; stepId: string; location: LocationId }
  | { type: 'decision'; stepId: string; interaction: InteractionId; config: unknown }
  | { type: 'consequence'; stepId: string; outcomeKeys: string[]; explanationKey: string }
  | {
      type: 'transfer'
      stepId: string
      variantId: string
      interaction: InteractionId
      config: unknown
    }

/** Contract state plus the active step's view; `view` is null once the level is done. */
export interface RunnerView extends RunnerState {
  view: StepView | null
}

/** Fallback dependencies for snapshots without metadata. */
export interface ResumeOptions {
  /** Transfer seed for legacy snapshots; defaults to 0. */
  seed?: number
  /** Clock for the resumed attempt; defaults to the factory clock. */
  now?: Clock
  /** Derived flags used only when a legacy snapshot has no saved condition decisions. */
  worldFlags?: Readonly<Record<string, string>>
}

/** Factory dependencies, injected so the runner stays pure and testable. */
export interface LevelRunnerDeps {
  /** Level lookup used by `resume`, which only receives a level id. */
  levels: readonly LevelDef[]
  /** Attempt id source. */
  newId: () => string
  /** Fallback clock for `resume` when none is passed. */
  now?: Clock
}

/** `LevelRunner` plus explicit step completion and mid-level snapshots. */
export interface LevelRunnerImpl extends LevelRunner {
  /** Captures derived flags for every conditional step at level start. */
  start(
    level: LevelDef,
    seed: number,
    now: Clock,
    worldFlags?: Readonly<Record<string, string>>,
  ): void
  current(): RunnerView
  /** Records an interaction event or applies a runner signal; returns whether it was accepted. */
  dispatch(event: RunnerInput): boolean
  resume(snapshot: InLevelSnapshot, opts?: ResumeOptions): void
  /** Same as dispatching `arrivedAt`; completes Travel only at the level's location. */
  arrive(locationId: LocationId): boolean
  /** Same as dispatching `continue`; completes the Hook and Consequence steps. */
  advance(): boolean
  /** Same as dispatching `interactionDone`; completes Lesson, Decision or Transfer. */
  complete(): boolean
  /** Mid-level state for `SaveFile.position.inLevel`. */
  snapshot(): InLevelSnapshot
}

interface Session {
  level: LevelDef
  seed: number
  now: Clock
  startedAt: string
  stepIndex: number
  events: InteractionEvent[]
  conditionResults?: Record<string, boolean>
  done: boolean
}

/** Creates a level runner that walks Hook → Lesson → Travel → Decision → Consequence → Transfer. */
export function createLevelRunner(deps: LevelRunnerDeps): LevelRunnerImpl {
  const levelsById = new Map(deps.levels.map((level) => [level.id as string, level]))
  const listeners: ((completion: LevelCompletion) => void)[] = []
  let session: Session | undefined

  const active = (): Session => {
    if (!session) throw new Error('Level runner has not started')
    return session
  }

  const begin = (
    level: LevelDef,
    seed: number,
    now: Clock,
    stepIndex: number,
    events: InteractionEvent[],
    worldFlags: Readonly<Record<string, string>>,
    startedAt = now(),
    savedConditions?: Record<string, boolean>,
  ) => {
    const conditionResults = Object.fromEntries(
      level.steps
        .filter((step) => step.when)
        .map((step) => [
          step.id,
          savedConditions?.[step.id] ?? worldFlags[step.when!.flag] === String(step.when!.equals),
        ]),
    )
    session = {
      level,
      seed,
      now,
      startedAt,
      stepIndex,
      events,
      conditionResults: Object.keys(conditionResults).length ? conditionResults : undefined,
      done: false,
    }
    skipHidden(session)
  }

  const transferVariant = (s: Session) => {
    const { variants } = s.level.steps[5]
    return variants[pickIndex(s.seed, variants.length)]!
  }

  const view = (s: Session): StepView | null => {
    if (s.done) return null
    const step = s.level.steps[s.stepIndex as 0 | 1 | 2 | 3 | 4 | 5]
    switch (step.type) {
      case 'hook':
        return { type: 'hook', stepId: step.id, lineKeys: step.lineKeys }
      case 'lesson':
      case 'decision':
        return {
          type: step.type,
          stepId: step.id,
          interaction: step.interaction,
          config: step.config,
        }
      case 'travel':
        return { type: 'travel', stepId: step.id, location: step.location }
      case 'consequence':
        return {
          type: 'consequence',
          stepId: step.id,
          outcomeKeys: step.outcomeKeys,
          explanationKey: step.explanationKey,
        }
      case 'transfer': {
        const variant = transferVariant(s)
        return {
          type: 'transfer',
          stepId: step.id,
          variantId: variant.id,
          interaction: variant.interaction,
          config: variant.config,
        }
      }
    }
  }

  const complete = (s: Session) => {
    s.done = true
    const result = score(s.events, s.level.steps[3].rubric)
    const errors: ErrorCategory[] = []
    for (const event of s.events) {
      if (
        event.kind === 'choice' &&
        !event.correct &&
        event.error &&
        !errors.includes(event.error)
      ) {
        errors.push(event.error)
      }
    }
    const attempt: AttemptRecord = {
      id: deps.newId(),
      levelId: s.level.id,
      contentVersion: contentVersion(s.level),
      startedAt: s.startedAt,
      endedAt: s.now(),
      stars: result.stars,
      errors,
      hints: s.events.filter((event) => event.kind === 'hint').length,
      worldChoices: Object.fromEntries(s.level.worldEffects.map(({ key, value }) => [key, value])),
    }
    for (const listener of listeners) listener({ attempt, score: result })
  }

  const next = (s: Session) => {
    if (s.stepIndex === s.level.steps.length - 1) complete(s)
    else {
      s.stepIndex += 1
      skipHidden(s)
    }
  }

  const skipHidden = (s: Session) => {
    while (s.conditionResults?.[s.level.steps[s.stepIndex].id] === false) {
      if (s.stepIndex === s.level.steps.length - 1) {
        complete(s)
        return
      }
      s.stepIndex += 1
    }
  }

  const dispatch = (input: RunnerInput): boolean => {
    const s = active()
    if (s.done) return false
    const step = s.level.steps[s.stepIndex as 0 | 1 | 2 | 3 | 4 | 5]

    if (input.kind === 'continue') {
      if (step.type !== 'hook' && step.type !== 'consequence') return false
      next(s)
      return true
    }
    if (input.kind === 'arrivedAt') {
      if (step.type !== 'travel' || input.locationId !== s.level.location) return false
      next(s)
      return true
    }

    // Scored events only count on an interactive step and only for that step's id, so a
    // late event from a closed panel cannot leak into the next step.
    if (step.type !== 'lesson' && step.type !== 'decision' && step.type !== 'transfer') return false
    if (input.kind === 'interactionDone') {
      next(s)
      return true
    }
    if (input.stepId !== step.id) return false
    s.events.push(input)
    return true
  }

  return {
    start(level, seed, now, worldFlags = {}) {
      begin(level, seed, now, 0, [], worldFlags)
    },

    resume(snapshot, opts = {}) {
      const level = levelsById.get(snapshot.levelId)
      if (!level) throw new Error(`Unknown level: ${snapshot.levelId}`)
      if (snapshot.stepIndex >= level.steps.length) {
        throw new Error(`Snapshot step ${snapshot.stepIndex} is past the end of ${level.id}`)
      }
      const now = opts.now ?? deps.now
      if (!now) throw new Error('resume needs a clock: pass opts.now or deps.now')
      begin(
        level,
        snapshot.seed ?? opts.seed ?? 0,
        now,
        snapshot.stepIndex,
        [...snapshot.events],
        opts.worldFlags ?? {},
        snapshot.startedAt,
        snapshot.conditionResults,
      )
    },

    current() {
      const s = active()
      return {
        levelId: s.level.id,
        stepIndex: s.stepIndex,
        events: [...s.events],
        done: s.done,
        view: view(s),
      }
    },

    dispatch,

    arrive(locationId) {
      return dispatch({ kind: 'arrivedAt', locationId })
    },

    advance() {
      return dispatch({ kind: 'continue' })
    },

    complete() {
      return dispatch({ kind: 'interactionDone' })
    },

    snapshot() {
      const s = active()
      return {
        levelId: s.level.id,
        stepIndex: s.stepIndex,
        events: [...s.events],
        seed: s.seed,
        startedAt: s.startedAt,
        ...(s.conditionResults && { conditionResults: { ...s.conditionResults } }),
      }
    },

    onComplete(cb) {
      listeners.push(cb)
    },
  }
}

import type {
  AttemptRecord,
  InteractionEvent,
  LevelId,
  Locale,
  LocationId,
  Settings,
} from '../contracts'

/** Every state change; time and ids arrive in payloads so the reducer stays pure. */
export type Action =
  | {
      type: 'profileCreated'
      localId: string
      locationId: LocationId
      now: string
      locale?: Locale
    }
  | { type: 'travelled'; locationId: LocationId }
  | { type: 'levelStarted'; levelId: LevelId }
  | { type: 'eventRecorded'; event: InteractionEvent }
  | { type: 'stepAdvanced' }
  | { type: 'stepEventsCleared'; stepId: string }
  | { type: 'attemptCompleted'; attempt: AttemptRecord }
  | { type: 'settingsUpdated'; patch: Partial<Omit<Settings, 'updatedAt'>>; updatedAt: string }
  | { type: 'transitionSeen'; id: string }

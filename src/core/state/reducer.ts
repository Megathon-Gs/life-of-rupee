import type { SaveFile } from '../contracts'
import type { Action } from './actions'
import { CURRENT_SCHEMA_VERSION } from './migrations'

/** Fresh save for a new local player. */
const createSave = (a: Extract<Action, { type: 'profileCreated' }>): SaveFile => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  learner: { localId: a.localId },
  settings: {
    locale: a.locale ?? 'en',
    reducedMotion: 'system',
    muted: false,
    textScale: 1,
    updatedAt: a.now,
  },
  position: { locationId: a.locationId },
  attempts: [],
  seen: [],
})

/** Pure reducer over the save; never mutates `state`, reads clocks or randomness. */
export function reducer(state: SaveFile, action: Action): SaveFile {
  switch (action.type) {
    case 'profileCreated':
      return createSave(action)
    case 'travelled':
      return { ...state, position: { ...state.position, locationId: action.locationId } }
    case 'levelStarted':
      return {
        ...state,
        position: {
          ...state.position,
          inLevel: { levelId: action.levelId, stepIndex: 0, events: [] },
        },
      }
    case 'eventRecorded': {
      const inLevel = state.position.inLevel
      if (!inLevel) return state
      return {
        ...state,
        position: {
          ...state.position,
          inLevel: { ...inLevel, events: [...inLevel.events, action.event] },
        },
      }
    }
    case 'stepAdvanced': {
      const inLevel = state.position.inLevel
      if (!inLevel) return state
      return {
        ...state,
        position: { ...state.position, inLevel: { ...inLevel, stepIndex: inLevel.stepIndex + 1 } },
      }
    }
    case 'stepEventsCleared': {
      const inLevel = state.position.inLevel
      if (!inLevel) return state
      const events = inLevel.events.filter((event) => event.stepId !== action.stepId)
      return { ...state, position: { ...state.position, inLevel: { ...inLevel, events } } }
    }
    case 'attemptCompleted': {
      if (state.attempts.some((x) => x.id === action.attempt.id)) return state
      const position = { locationId: state.position.locationId }
      return { ...state, position, attempts: [...state.attempts, action.attempt] }
    }
    case 'settingsUpdated':
      return {
        ...state,
        settings: { ...state.settings, ...action.patch, updatedAt: action.updatedAt },
      }
    case 'transitionSeen':
      return state.seen.includes(action.id) ? state : { ...state, seen: [...state.seen, action.id] }
  }
}

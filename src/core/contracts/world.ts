import { z } from 'zod'
import type { WorldEffect } from './content'
import type { LocationId } from './ids'

/** Shared flags; Level 9 records an accepted loan for Level 6 via loan.activeInstallment. */
export const WORLD_FLAGS = [
  'fraud.seenWarningSigns',
  'loan.activeInstallment',
  'savings.goalMet',
  'insurance.policyInspected',
  'curriculum.completed',
] as const

/** Level 5 completion flag used by the Level 9 callback. */
export const FRAUD_WARNING_WORLD_EFFECT = {
  key: 'fraud.seenWarningSigns',
  value: 'true',
} as const satisfies WorldEffect

/** Schema for visual variants derived from saved world flags. */
export const WorldVisualsSchema = z.record(z.string(), z.string())
/** Map of visual slot to variant, e.g. { bankTeller: 'greets' }. */
export type WorldVisuals = z.infer<typeof WorldVisualsSchema>

/** Renderer contract: the only way the app touches the town. */
export interface WorldRenderer {
  mount(el: unknown): void
  resize(): void
  travelTo(id: LocationId, opts: { reducedMotion: boolean }): Promise<void>
  applyVisuals(v: WorldVisuals): void
  onArrive(cb: (id: LocationId) => void): void
  setPaused(paused: boolean): void
  destroy(): void
}

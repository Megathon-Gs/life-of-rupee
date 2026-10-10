import { z } from 'zod'
import type { LocationId } from './ids'

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

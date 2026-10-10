import type { LocationId } from '@/core/contracts'

// Plain-fade placeholders: the panel's own fade is the only transition for now.
// P0-21 owns this file and replaces these hooks with real transitions.

/** Called once the protagonist reaches a location. */
export const onArrive: (id: LocationId) => Promise<void> = async () => {}

/** Called when the player goes through a door into a location's level. */
export const enterLocation: (id: LocationId) => Promise<void> = async () => {}

/** Called when the player leaves a location's level panel. */
export const exitLocation: (id: LocationId) => Promise<void> = async () => {}

import type { LocationId, WorldVisuals } from '@/core/contracts'

/**
 * `deriveWorldVisuals` names visual slots (`bankTeller`), but the renderer and greybox
 * textures look variants up by location id. Until those agree, the app maps each slot
 * onto the building that shows it.
 */
export const VISUAL_SLOT_LOCATIONS: Readonly<Record<string, string>> = {
  bankTeller: 'bank',
}

/** Renderer-ready visuals: slots moved onto their location, 'default' variants dropped. */
export function toRendererVisuals(visuals: WorldVisuals): WorldVisuals {
  const out: WorldVisuals = {}
  for (const [slot, variant] of Object.entries(visuals)) {
    // A 'default' variant would be tinted as a variant instead of the district colour.
    if (variant === 'default') continue
    out[(VISUAL_SLOT_LOCATIONS[slot] ?? slot) as LocationId] = variant
  }
  return out
}

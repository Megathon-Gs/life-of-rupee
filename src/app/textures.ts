import { capstoneFrames } from '@/content/capstoneArt'
import {
  GreyboxTextureProvider,
  type LayerName,
  type ProtagonistState,
  type TextureProvider,
} from '@/world'
import { loadAtlasTextureProvider, type AtlasTextureProvider } from '@/world/assets'

/**
 * Building assets and their atlas frames (P1 and P2). The frame tables live under
 * `src/world` (not this task's paths), so the mapping is applied here, mirroring
 * the variants core/worldVisuals derives per location id.
 */
const BUILDING_VARIANT_FRAMES: Record<string, Record<string, string>> = {
  'phone-shop': {
    default: 'phone-shop-unlit',
    lit: 'phone-shop-lit',
    recognises: 'phone-shop-lit',
    'lit-recognises': 'phone-shop-lit',
  },
  showroom: { default: 'showroom-unlit', lit: 'showroom-lit' },
  // P2: lit once the district light (derived from the unlocked locations) is on.
  market: { default: 'market-unlit', lit: 'market-lit' },
  workplace: { default: 'office-unlit', lit: 'office-lit' },
  'insurance-desk': {
    default: 'insurance-desk-unlit',
    lit: 'insurance-desk-lit',
    recognises: 'insurance-desk-lit',
  },
  'learning-centre': { default: 'learning-centre-unlit', lit: 'learning-centre-lit' },
  // No default: the concept exterior only shows once a flag-derived variant arrives; it lights
  // up ('open') after Level 12.
  capstone: { locked: capstoneFrames().unlit, open: capstoneFrames().lit },
}

/** District whose `district.<id>` visual lights the buildings of these assets. */
const DISTRICT_LIT_ASSETS = new Set(['market', 'workplace', 'insurance-desk', 'learning-centre'])

/** Wraps the atlas provider so P1/P2 buildings resolve to their lit/unlit frames. */
function withBuildingVariants(provider: AtlasTextureProvider): TextureProvider {
  return {
    sky: provider.sky,
    pavement: provider.pavement,
    layer: (name: LayerName) => provider.layer(name),
    skyExtended: (rows: number) => provider.skyExtended(rows),
    protagonist: (state: ProtagonistState) => provider.protagonist(state),
    protagonistFrames: (state: ProtagonistState) => provider.protagonistFrames(state),
    building: (location, visuals) => {
      const frames = BUILDING_VARIANT_FRAMES[location.buildingAsset]
      const districtLit =
        DISTRICT_LIT_ASSETS.has(location.buildingAsset) &&
        visuals[`district.${location.district}`] === 'lit'
      const variant = visuals[location.id] ?? (districtLit ? 'lit' : undefined)
      const frame = frames && ((variant && frames[variant]) ?? frames.default)
      return frame
        ? { texture: provider.frame(frame, undefined, true), tint: 0xffffff }
        : provider.building(location, visuals)
    },
  }
}

/**
 * Textures for the world renderer: the real art atlases (P0-22), preloaded so the renderer
 * can use them synchronously. Falls back to the greybox set if the atlases cannot load.
 */
export async function loadTextureProvider(): Promise<TextureProvider> {
  try {
    return withBuildingVariants(await loadAtlasTextureProvider())
  } catch (error) {
    console.error('Art atlases failed to load; using greybox textures', error)
    return new GreyboxTextureProvider()
  }
}
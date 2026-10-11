import { capstoneFrames } from '@/content/capstoneArt'
import {
  GreyboxTextureProvider,
  type LayerName,
  type ProtagonistState,
  type TextureProvider,
} from '@/world'
import { loadAtlasTextureProvider, type AtlasTextureProvider } from '@/world/assets'

/**
 * P1 building assets and their atlas frames. The frame tables live under
 * `src/world` (not this task's paths), so the mapping is applied here, mirroring
 * the variants core/worldVisuals derives per location id.
 */
const P1_BUILDING_FRAMES: Record<string, Record<string, string>> = {
  'phone-shop': {
    default: 'phone-shop-unlit',
    lit: 'phone-shop-lit',
    recognises: 'phone-shop-lit',
    'lit-recognises': 'phone-shop-lit',
  },
  showroom: { default: 'showroom-unlit', lit: 'showroom-lit' },
  // No default: the concept exterior only shows once the flag-derived 'locked' variant arrives.
  capstone: { locked: capstoneFrames().unlit },
}

/** Wraps the atlas provider so P1 buildings resolve to their lit/unlit frames. */
function withP1Buildings(provider: AtlasTextureProvider): TextureProvider {
  return {
    sky: provider.sky,
    pavement: provider.pavement,
    layer: (name: LayerName) => provider.layer(name),
    skyExtended: (rows: number) => provider.skyExtended(rows),
    protagonist: (state: ProtagonistState) => provider.protagonist(state),
    protagonistFrames: (state: ProtagonistState) => provider.protagonistFrames(state),
    building: (location, visuals) => {
      const frames = P1_BUILDING_FRAMES[location.buildingAsset]
      const variant = visuals[location.id]
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
    return withP1Buildings(await loadAtlasTextureProvider())
  } catch (error) {
    console.error('Art atlases failed to load; using greybox textures', error)
    return new GreyboxTextureProvider()
  }
}
import { GreyboxTextureProvider, type TextureProvider } from '@/world'
import { loadAtlasTextureProvider } from '@/world/assets'

/**
 * Textures for the world renderer: the real art atlases (P0-22), preloaded so the renderer
 * can use them synchronously. Falls back to the greybox set if the atlases cannot load.
 */
export async function loadTextureProvider(): Promise<TextureProvider> {
  try {
    return await loadAtlasTextureProvider()
  } catch (error) {
    console.error('Art atlases failed to load; using greybox textures', error)
    return new GreyboxTextureProvider()
  }
}

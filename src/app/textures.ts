import { GreyboxTextureProvider, type TextureProvider } from '@/world'

/** Textures for the world renderer: the greybox set until real art lands (P0-22). */
export function createTextureProvider(): TextureProvider {
  return new GreyboxTextureProvider()
}

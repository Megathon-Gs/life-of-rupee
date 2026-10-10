import { ImageSource } from 'pixi.js'
import { AtlasTextureProvider, type LoadedAtlas } from './AtlasTextureProvider'
import { ASSET_BASE, parseManifest, type AtlasManifest } from './manifest'

async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = url
  await image.decode()
  return image
}

/**
 * Fetch the manifest and every district atlas from the app's own origin, then build the
 * provider. The result is synchronous to use, so the renderer never sees a half-loaded texture.
 */
export async function loadAtlasTextureProvider(
  base: string = ASSET_BASE,
): Promise<AtlasTextureProvider> {
  const response = await fetch(`${base}/manifest.json`)
  if (!response.ok) throw new Error(`Asset manifest failed to load (${response.status})`)
  const manifest: AtlasManifest = parseManifest(await response.json())
  const atlases: Record<string, LoadedAtlas> = {}
  await Promise.all(
    Object.entries(manifest.districts).map(async ([district, entry]) => {
      const image = await loadImage(`${base}/${entry.atlas}`)
      const source = new ImageSource({ resource: image, scaleMode: 'nearest' })
      atlases[district] = { source, image }
    }),
  )
  return new AtlasTextureProvider(manifest, atlases)
}

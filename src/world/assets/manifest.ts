/** One frame of a packed atlas, in atlas pixels. */
export interface AtlasFrame {
  x: number
  y: number
  w: number
  h: number
}

/** One packed district atlas. */
export interface AtlasDistrict {
  atlas: string
  width: number
  height: number
  frames: Record<string, AtlasFrame>
}

/** `public/assets/manifest.json`, written by `pnpm build:assets`. */
export interface AtlasManifest {
  version: number
  districts: Record<string, AtlasDistrict>
}

/** Where the packed art is served from: the app's own origin only. */
export const ASSET_BASE = '/assets'

/** Narrow an unknown JSON value to a manifest, or throw. */
export function parseManifest(value: unknown): AtlasManifest {
  const manifest = value as Partial<AtlasManifest> | null
  if (!manifest || manifest.version !== 1 || typeof manifest.districts !== 'object') {
    throw new Error('Unsupported asset manifest')
  }
  return manifest as AtlasManifest
}

/** Look a frame up by name across districts. */
export function findFrame(
  manifest: AtlasManifest,
  name: string,
): { district: string; frame: AtlasFrame } | undefined {
  for (const [district, entry] of Object.entries(manifest.districts)) {
    const frame = entry.frames[name]
    if (frame) return { district, frame }
  }
  return undefined
}

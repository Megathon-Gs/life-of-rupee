import { ImageSource, Rectangle, Texture, type TextureSource } from 'pixi.js'
import type { LocationDef, WorldVisuals } from '@/core/contracts'
import {
  GROUND_Y,
  type BuildingSprite,
  type LayerName,
  type ProtagonistState,
  type TextureProvider,
} from '../textures'
import { findFrame, type AtlasManifest } from './manifest'

/** Palette A sky and pavement colours (art/bible/palette.json). */
export const SKY_COLOUR = 0xd3eef0
export const PAVEMENT_COLOUR = 0xb98260

/** Logical height of a parallax band; mirrors the renderer's stage height. */
export const BAND_HEIGHT = 270
/** Width of the composed street tile, a whole number of 32 px road tiles. */
const STREET_TILE_WIDTH = 256

/** `LocationDef.buildingAsset` → atlas frame name. */
export const BUILDING_FRAMES: Record<string, string> = {
  home: 'home',
  bank: 'bank-default',
  kirana: 'kirana',
  shop: 'filler-shophouse',
  house: 'filler-apartment',
}
/** Building frames swapped in for a visuals variant. */
export const VARIANT_FRAMES: Record<string, Record<string, string>> = {
  bank: { greets: 'bank-greets' },
}

/** Protagonist sheet frame size and the one frame shown for each state (east-facing). */
export const PROTAGONIST_FRAME = { w: 32, h: 48 }
const PROTAGONIST_STATES: Record<ProtagonistState, { sheet: string; index: number }> = {
  idle: { sheet: 'protagonist-idle-east', index: 0 },
  walk: { sheet: 'protagonist-walk-east', index: 1 },
  run: { sheet: 'protagonist-run-east', index: 1 },
  arrive: { sheet: 'protagonist-arrive-east', index: 4 },
}

const PARALLAX_FRAMES = { sky: 'sky', far: 'far-skyline', mid: 'mid-trees-wires' } as const

const HAS_2D = typeof document !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined'

/** Atlas pixels per district: an image to read from and the texture source built over it. */
export interface LoadedAtlas {
  source: TextureSource
  image?: CanvasImageSource
}

/**
 * Real-art textures cut from the packed district atlases. Everything is synchronous: the
 * atlases are loaded before the provider is built (see `loadAtlasTextureProvider`).
 */
export class AtlasTextureProvider implements TextureProvider {
  readonly sky = SKY_COLOUR
  readonly pavement = PAVEMENT_COLOUR

  private readonly cache = new Map<string, Texture>()

  constructor(
    private readonly manifest: AtlasManifest,
    private readonly atlases: Record<string, LoadedAtlas>,
  ) {}

  /** Texture for a named frame at its native size, or `Texture.EMPTY` when absent. */
  frame(name: string, part?: { index: number; w: number }): Texture {
    const key = part ? `${name}#${part.index}` : name
    const cached = this.cache.get(key)
    if (cached) return cached
    const found = findFrame(this.manifest, name)
    const atlas = found && this.atlases[found.district]
    if (!found || !atlas) return Texture.EMPTY
    const { x, y, w, h } = found.frame
    const width = part ? part.w : w
    const left = x + (part ? part.index * part.w : 0)
    const texture = new Texture({ source: atlas.source, frame: new Rectangle(left, y, width, h) })
    this.cache.set(key, texture)
    return texture
  }

  layer(name: LayerName): Texture {
    const cached = this.cache.get(`layer:${name}`)
    if (cached) return cached
    const texture = this.compose(name)
    this.cache.set(`layer:${name}`, texture)
    return texture
  }

  building(location: LocationDef, visuals: WorldVisuals): BuildingSprite {
    const variant = visuals[location.id]
    const name =
      (variant && VARIANT_FRAMES[location.buildingAsset]?.[variant]) ??
      BUILDING_FRAMES[location.buildingAsset] ??
      location.buildingAsset
    return { texture: this.frame(name), tint: 0xffffff }
  }

  protagonist(state: ProtagonistState): Texture {
    const { sheet, index } = PROTAGONIST_STATES[state]
    return this.frame(sheet, { index, w: PROTAGONIST_FRAME.w })
  }

  /** A full-height tile: the art sits on a transparent canvas so it never repeats vertically. */
  private compose(name: LayerName): Texture {
    const canvas = this.canvasFor(name)
    return canvas ?? this.blank()
  }

  private blank(): Texture {
    let resource: HTMLCanvasElement | undefined
    if (HAS_2D) {
      resource = document.createElement('canvas')
      resource.width = 1
      resource.height = 1
    }
    const texture = new Texture({
      source: new ImageSource(resource ? { resource } : { width: 1, height: 1 }),
    })
    texture.source.scaleMode = 'nearest'
    return texture
  }

  private canvasFor(name: LayerName): Texture | undefined {
    if (name === 'foreground' || !HAS_2D) return undefined
    const draw = (
      width: number,
      paint: (ctx: CanvasRenderingContext2D, image: CanvasImageSource) => void,
    ) => {
      const urban = this.atlases.urban?.image
      if (!urban) return undefined
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = BAND_HEIGHT
      const ctx = canvas.getContext('2d')
      if (!ctx) return undefined
      ctx.imageSmoothingEnabled = false
      paint(ctx, urban)
      const texture = new Texture({ source: new ImageSource({ resource: canvas }) })
      texture.source.scaleMode = 'nearest'
      return texture
    }
    const blit = (
      ctx: CanvasRenderingContext2D,
      image: CanvasImageSource,
      frame: string,
      dx: number,
      dy: number,
    ) => {
      const found = findFrame(this.manifest, frame)?.frame
      if (found) ctx.drawImage(image, found.x, found.y, found.w, found.h, dx, dy, found.w, found.h)
      return found
    }
    if (name === 'street') {
      return draw(STREET_TILE_WIDTH, (ctx, image) => {
        const kerb = findFrame(this.manifest, 'kerb-road')?.frame
        const pave = findFrame(this.manifest, 'pavement')?.frame
        // Pavement strip on the ground line, road and kerb below it.
        const roadY = GROUND_Y + (pave?.h ?? 0)
        for (let x = 0; x < STREET_TILE_WIDTH; x += pave?.w ?? STREET_TILE_WIDTH) {
          if (pave) blit(ctx, image, 'pavement', x, GROUND_Y)
        }
        for (let y = roadY; y < BAND_HEIGHT; y += kerb?.h ?? BAND_HEIGHT) {
          for (let x = 0; x < STREET_TILE_WIDTH; x += kerb?.w ?? STREET_TILE_WIDTH) {
            if (kerb) blit(ctx, image, 'kerb-road', x, y)
          }
        }
      })
    }
    const frameName = PARALLAX_FRAMES[name]
    const found = findFrame(this.manifest, frameName)?.frame
    if (!found) return undefined
    // The sky fills the band from the top; the skyline and trees stand on the ground line.
    const dy = name === 'sky' ? 0 : GROUND_Y - found.h
    return draw(found.w, (ctx, image) => {
      blit(ctx, image, frameName, 0, dy)
    })
  }
}

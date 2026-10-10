import { ImageSource, Rectangle, Texture, type TextureSource } from 'pixi.js'
import type { LocationDef, WorldVisuals } from '@/core/contracts'
import {
  GROUND_Y,
  type BuildingSprite,
  type LayerName,
  type ProtagonistState,
  type TextureProvider,
} from '../textures'
import { findFrame, type AtlasFrame, type AtlasManifest } from './manifest'

/** Palette A sky and pavement colours (art/bible/palette.json). */
/** The flat top band of the sky art, so the scale remainder above the stage is seamless. */
export const SKY_COLOUR = 0x5fa3d6
export const PAVEMENT_COLOUR = 0xb98260

/** Logical height of a parallax band; mirrors the renderer's stage height. */
export const BAND_HEIGHT = 270
/** Width of the composed street tile, a whole number of 32 px road tiles. */
const STREET_TILE_WIDTH = 256
/** Rows the street texture carries below the stage, so the road can reach the viewport bottom. */
const STREET_EXTRA_ROWS = 320
/** Sky art rows 0-39 are the dark top band and its checker; 88-127 are the cloud rows. */
const SKY_TOP_ROWS = 40
/** A facade's base row must be at least this fraction opaque (kirana has 2 stray rows of ~10%). */
const FACADE_MIN_FILL = 0.25
const SKY_BLOCK_START = 88
const SKY_BLOCK_END = 128
const SKY_BLOCK_SHIFT = 61

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
  private readonly alpha = new Map<string, ImageData>()

  constructor(
    private readonly manifest: AtlasManifest,
    private readonly atlases: Record<string, LoadedAtlas>,
  ) {}

  /** Texture for a named frame at its native size, or `Texture.EMPTY` when absent. */
  /** Rows from `top` of a frame up to its last non-transparent pixel row, or the full height. */
  private opaqueHeight(district: string, frame: AtlasFrame, minFill = 0): number {
    const image = this.atlases[district]?.image
    if (!HAS_2D || !image) return frame.h
    let alpha = this.alpha.get(district)
    if (!alpha) {
      const canvas = document.createElement('canvas')
      const { width, height } = this.manifest.districts[district]!
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return frame.h
      ctx.drawImage(image, 0, 0)
      alpha = ctx.getImageData(0, 0, width, height)
      this.alpha.set(district, alpha)
    }
    // A row counts as ground when at least `minFill` of the frame width is opaque, so stray
    // shadow or grass pixels under a facade do not hold its base above the ground line.
    const need = Math.max(1, Math.ceil(frame.w * minFill))
    for (let row = frame.h - 1; row >= 0; row -= 1) {
      let filled = 0
      for (let col = 0; col < frame.w; col += 1) {
        const at = ((frame.y + row) * alpha.width + frame.x + col) * 4 + 3
        if (alpha.data[at]! > 0) filled += 1
      }
      if (filled >= need) return row + 1
    }
    return frame.h
  }

  frame(name: string, part?: { index: number; w: number }, trim = false): Texture {
    const key = `${part ? `${name}#${part.index}` : name}${trim ? ':trim' : ''}`
    const cached = this.cache.get(key)
    if (cached) return cached
    const found = findFrame(this.manifest, name)
    const atlas = found && this.atlases[found.district]
    if (!found || !atlas) return Texture.EMPTY
    const { x, y, w } = found.frame
    // Trimming drops transparent rows at the bottom so a sprite anchored there stands on the ground.
    const h = trim ? this.opaqueHeight(found.district, found.frame, FACADE_MIN_FILL) : found.frame.h
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

  /**
   * The sky art with extra open-sky rows spliced in under its dark top band, so the sky reaches the
   * top of a tall portrait viewport. The spliced rows repeat the art's own cloud rows, shifted
   * sideways each repeat, so there is no tall flat colour run.
   */
  skyExtended(extraRows: number): Texture {
    const extra = Math.max(0, Math.round(extraRows))
    const key = `sky+${extra}`
    const cached = this.cache.get(key)
    if (cached) return cached
    const art = findFrame(this.manifest, PARALLAX_FRAMES.sky)?.frame
    const image = this.atlases.urban?.image
    let texture: Texture | undefined
    if (HAS_2D && art && image) {
      const canvas = document.createElement('canvas')
      canvas.width = art.w
      canvas.height = art.h + extra
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.imageSmoothingEnabled = false
        const row = (srcRow: number, dstRow: number, shift = 0) => {
          for (const dx of [shift, shift - art.w]) {
            ctx.drawImage(image, art.x, art.y + srcRow, art.w, 1, dx, dstRow, art.w, 1)
          }
        }
        for (let r = 0; r < SKY_TOP_ROWS; r += 1) row(r, r)
        for (let r = SKY_TOP_ROWS; r < SKY_TOP_ROWS + extra; r += 1) {
          const k = SKY_TOP_ROWS + extra - 1 - r
          const span = SKY_BLOCK_END - SKY_BLOCK_START
          row(SKY_BLOCK_END - 1 - (k % span), r, (Math.floor(k / span) * SKY_BLOCK_SHIFT) % art.w)
        }
        for (let r = SKY_TOP_ROWS; r < art.h; r += 1) row(r, r + extra)
        texture = new Texture({ source: new ImageSource({ resource: canvas }) })
        texture.source.scaleMode = 'nearest'
      }
    }
    texture ??= this.layer('sky')
    this.cache.set(key, texture)
    return texture
  }

  building(location: LocationDef, visuals: WorldVisuals): BuildingSprite {
    const variant = visuals[location.id]
    const name =
      (variant && VARIANT_FRAMES[location.buildingAsset]?.[variant]) ??
      BUILDING_FRAMES[location.buildingAsset] ??
      location.buildingAsset
    return { texture: this.frame(name, undefined, true), tint: 0xffffff }
  }

  protagonistFrames(state: ProtagonistState): readonly Texture[] {
    const { sheet, index } = PROTAGONIST_STATES[state]
    const found = findFrame(this.manifest, sheet)?.frame
    if (!found) return []
    // The arrive sheet is a pose to hold, not a cycle.
    if (state === 'arrive') return [this.frame(sheet, { index, w: PROTAGONIST_FRAME.w })]
    const count = Math.max(1, Math.floor(found.w / PROTAGONIST_FRAME.w))
    return Array.from({ length: count }, (_, i) =>
      this.frame(sheet, { index: i, w: PROTAGONIST_FRAME.w }),
    )
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
      height: number,
      paint: (ctx: CanvasRenderingContext2D, image: CanvasImageSource) => void,
    ) => {
      const urban = this.atlases.urban?.image
      if (!urban) return undefined
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
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
      return draw(STREET_TILE_WIDTH, BAND_HEIGHT + STREET_EXTRA_ROWS, (ctx, image) => {
        const kerb = findFrame(this.manifest, 'kerb-road')?.frame
        const pave = findFrame(this.manifest, 'pavement')?.frame
        // Pavement strip on the ground line, road and kerb below it.
        const roadY = GROUND_Y + (pave?.h ?? 0)
        for (let x = 0; x < STREET_TILE_WIDTH; x += pave?.w ?? STREET_TILE_WIDTH) {
          if (pave) blit(ctx, image, 'pavement', x, GROUND_Y)
        }
        for (let y = roadY; y < BAND_HEIGHT + STREET_EXTRA_ROWS; y += kerb?.h ?? BAND_HEIGHT) {
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
    const rows =
      name === 'sky'
        ? found.h
        : this.opaqueHeight(findFrame(this.manifest, frameName)!.district, found)
    const dy = name === 'sky' ? 0 : GROUND_Y - rows
    return draw(found.w, BAND_HEIGHT, (ctx, image) => {
      blit(ctx, image, frameName, 0, dy)
    })
  }
}

import { Texture } from 'pixi.js'
import type { LocationDef, WorldVisuals } from '@/core/contracts'

/** Parallax layers, back to front, each with its scroll factor. */
export const LAYERS = [
  { name: 'sky', factor: 0.1 },
  { name: 'far', factor: 0.3 },
  { name: 'mid', factor: 0.6 },
  { name: 'street', factor: 1.0 },
  { name: 'foreground', factor: 1.2 },
] as const

/** Name of a parallax layer. */
export type LayerName = (typeof LAYERS)[number]['name']

/** Protagonist animation states. */
export type ProtagonistState = 'idle' | 'walk' | 'run' | 'arrive'

/** One drawable returned by the provider. */
export interface BuildingSprite {
  texture: Texture
  tint: number
}

/**
 * Draws every pixel of the town. P0-22 swaps the greybox provider for an atlas
 * provider without the renderer internals changing.
 */
export interface TextureProvider {
  /** Sky colour behind everything. */
  readonly sky: number
  /** Pavement colour below the street line. */
  readonly pavement: number
  /** Tileable texture for a parallax band. */
  layer(name: LayerName): Texture
  /** Building block for a location, already reflecting the current visuals. */
  building(location: LocationDef, visuals: WorldVisuals): BuildingSprite
  /** Protagonist frame, drawn facing right; the renderer flips it for left. */
  protagonist(state: ProtagonistState): Texture
}

const NEAREST = 'nearest' as const

function withNearest(texture: Texture): Texture {
  texture.source.scaleMode = NEAREST
  return texture
}

/** Flat-colour canvas texture, or a white 1×1 when there is no 2D context (jsdom). */
const HAS_2D = typeof document !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined'

function makeTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (!HAS_2D) return withNearest(Texture.WHITE)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return withNearest(Texture.WHITE)
  draw(ctx)
  return withNearest(Texture.from(canvas))
}

const SKY = 0xb9dff0
const PAVEMENT = 0x9aa0a6
const FAR = 0x9fb8c4
const MID_GREEN = 0x7fa48f
const DISTRICT_COLOURS: Record<string, number> = {
  urban: 0xc9a86a,
  'high-street': 0xb98c5a,
  'rural-connected': 0x8fae6a,
}
const FOREGROUND = 0x5b6670

/** Hash a variant string to a stable greybox palette index. */
export function variantTint(variant: string): number {
  let hash = 0
  for (let i = 0; i < variant.length; i += 1) hash = (hash * 31 + variant.charCodeAt(i)) | 0
  const palette = [0xd9c07a, 0xc98f7a, 0x8fc0c9, 0xa8c98f]
  return palette[Math.abs(hash) % palette.length]!
}

/** Greybox textures: flat shapes on a canvas, one flat colour per thing. */
export class GreyboxTextureProvider implements TextureProvider {
  readonly sky = SKY
  readonly pavement = PAVEMENT

  layer(name: LayerName): Texture {
    switch (name) {
      case 'sky':
        return this.one('sky', () =>
          makeTexture(256, LOGICAL_TILE_H, (ctx) => {
            ctx.fillStyle = '#d6ecf7'
            ctx.fillRect(0, 0, 256, 60)
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.fillRect(40, 30, 60, 16)
            ctx.fillRect(150, 14, 70, 14)
          }),
        )
      case 'far':
        return this.one('far', () =>
          makeTexture(256, LOGICAL_TILE_H, (ctx) => {
            ctx.fillStyle = `#${FAR.toString(16).padStart(6, '0')}`
            for (const [x, w, h] of [
              [0, 46, 90],
              [60, 34, 130],
              [110, 44, 70],
              [170, 40, 110],
            ] as const) {
              ctx.fillRect(x, LOGICAL_TILE_H - h, w, h)
            }
          }),
        )
      case 'mid':
        return this.one('mid', () =>
          makeTexture(256, LOGICAL_TILE_H, (ctx) => {
            ctx.fillStyle = `#${MID_GREEN.toString(16).padStart(6, '0')}`
            for (const x of [30, 110, 190]) {
              ctx.beginPath()
              ctx.arc(x, LOGICAL_TILE_H - 70, 30, 0, Math.PI * 2)
              ctx.fill()
              ctx.fillRect(x - 4, LOGICAL_TILE_H - 70, 8, 70)
            }
            ctx.strokeStyle = '#4b5563'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(0, 40)
            ctx.lineTo(256, 52)
            ctx.stroke()
          }),
        )
      case 'street':
        return this.one('street', () =>
          makeTexture(256, LOGICAL_TILE_H, (ctx) => {
            ctx.fillStyle = '#b6bcc2'
            ctx.fillRect(0, GROUND_Y, 256, LOGICAL_TILE_H - GROUND_Y)
          }),
        )
      default:
        return this.one('foreground', () =>
          makeTexture(256, LOGICAL_TILE_H, (ctx) => {
            ctx.fillStyle = `#${FOREGROUND.toString(16).padStart(6, '0')}`
            ctx.fillRect(0, LOGICAL_TILE_H - 46, 256, 46)
            for (const x of [20, 120, 220]) {
              ctx.fillStyle = '#4b5563'
              ctx.beginPath()
              ctx.arc(x, LOGICAL_TILE_H - 40, 16, 0, Math.PI * 2)
              ctx.fill()
            }
          }),
        )
    }
  }

  building(location: LocationDef, visuals: WorldVisuals): BuildingSprite {
    const variant = visuals[location.id]
    const tint = variant ? variantTint(variant) : (DISTRICT_COLOURS[location.district] ?? 0xc0c0c0)
    const texture = makeTexture(BUILDING_WIDTH, BUILDING_HEIGHT, (ctx) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, BUILDING_WIDTH, BUILDING_HEIGHT)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(0, 0, BUILDING_WIDTH, 14)
      for (let y = 30; y < BUILDING_HEIGHT - 40; y += 28) {
        ctx.fillRect(12, y, 24, 18)
        ctx.fillRect(60, y, 24, 18)
      }
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(BUILDING_WIDTH / 2 - 14, BUILDING_HEIGHT - 44, 28, 44)
    })
    return { texture, tint }
  }

  protagonist(state: ProtagonistState): Texture {
    return makeTexture(PROTAGONIST_WIDTH, PROTAGONIST_HEIGHT, (ctx) => {
      ctx.fillStyle = '#2b6cb0'
      const legSplit = state === 'walk' ? 6 : state === 'run' ? 10 : 2
      const lean = state === 'run' ? 4 : 0
      ctx.fillRect(12 + lean, 16, 8, 20)
      ctx.fillRect(12 - legSplit + lean, 36, 6, 12)
      ctx.fillRect(14 + legSplit + lean, 36, 6, 12)
      ctx.fillStyle = '#e2a76f'
      ctx.beginPath()
      ctx.arc(16 + lean, 10, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#e2a76f'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(14 + lean, 20)
      const armY = state === 'arrive' ? 4 : 26
      ctx.lineTo(state === 'arrive' ? 28 : 26 + lean, armY)
      ctx.stroke()
    })
  }

  private cache = new Map<string, Texture>()

  private one(key: string, make: () => Texture): Texture {
    let texture = this.cache.get(key)
    if (!texture) {
      texture = make()
      this.cache.set(key, texture)
    }
    return texture
  }
}

/** Logical height of a parallax tile. */
const LOGICAL_TILE_H = 270
/** Ground line inside the logical band: buildings and the protagonist stand here. */
export const GROUND_Y = 210
/** Logical greybox building size. */
export const BUILDING_WIDTH = 96
export const BUILDING_HEIGHT = 160
/** Logical greybox protagonist size. */
export const PROTAGONIST_WIDTH = 32
export const PROTAGONIST_HEIGHT = 48

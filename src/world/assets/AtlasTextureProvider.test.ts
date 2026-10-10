import { TextureSource } from 'pixi.js'
import { describe, expect, it } from 'vitest'
import type { LocationDef } from '@/core/contracts'
import { world } from '@/content/world'
import { AtlasTextureProvider } from './AtlasTextureProvider'
import { parseManifest, type AtlasManifest } from './manifest'

const manifest: AtlasManifest = {
  version: 1,
  districts: {
    urban: {
      atlas: 'urban.test.png',
      width: 736,
      height: 304,
      frames: {
        home: { x: 0, y: 0, w: 160, h: 160 },
        'bank-default': { x: 160, y: 0, w: 160, h: 160 },
        'bank-greets': { x: 320, y: 0, w: 160, h: 160 },
        kirana: { x: 0, y: 160, w: 160, h: 96 },
        'filler-shophouse': { x: 160, y: 160, w: 160, h: 96 },
        'filler-apartment': { x: 320, y: 160, w: 160, h: 96 },
        'protagonist-walk-east': { x: 480, y: 0, w: 256, h: 48 },
        'protagonist-idle-east': { x: 0, y: 256, w: 128, h: 48 },
        'protagonist-run-east': { x: 128, y: 256, w: 160, h: 48 },
        'protagonist-arrive-east': { x: 288, y: 256, w: 160, h: 48 },
      },
    },
  },
}

const provider = new AtlasTextureProvider(manifest, {
  urban: { source: new TextureSource({ width: 736, height: 304 }) },
})
const location = (id: string) => world.locations.find((l) => l.id === id) as LocationDef

describe('AtlasTextureProvider', () => {
  it('maps each buildingAsset to its frame at native size with a white tint', () => {
    const cases: Array<[string, number, number]> = [
      ['home', 0, 0],
      ['bank', 160, 0],
      ['kirana', 0, 160],
      ['filler-1', 160, 160],
      ['filler-2', 320, 160],
    ]
    for (const [id, x, y] of cases) {
      const { texture, tint } = provider.building(location(id), {})
      expect([texture.frame.x, texture.frame.y]).toEqual([x, y])
      expect(texture.frame.width).toBe(160)
      expect(tint).toBe(0xffffff)
    }
  })

  it('shows the greeting facade when the bank greets', () => {
    const { texture } = provider.building(location('bank'), { bank: 'greets' })
    expect(texture.frame.x).toBe(320)
  })

  it('cuts one east-facing 32x48 protagonist frame from the sheet', () => {
    const texture = provider.protagonist('walk')
    expect(texture.frame.width).toBe(32)
    expect(texture.frame.height).toBe(48)
    expect(texture.frame.x).toBe(480 + 32)
  })

  it('offers every frame of each cycle, and holds one arrive pose', () => {
    expect(provider.protagonistFrames('walk')).toHaveLength(8)
    expect(provider.protagonistFrames('idle')).toHaveLength(4)
    expect(provider.protagonistFrames('run')).toHaveLength(5)
    expect(provider.protagonistFrames('arrive')).toHaveLength(1)
    const [first, second] = provider.protagonistFrames('walk')
    expect(second!.frame.x - first!.frame.x).toBe(32)
  })

  it('returns a texture for every layer, and caches them', () => {
    for (const name of ['sky', 'far', 'mid', 'street', 'foreground'] as const) {
      const texture = provider.layer(name)
      expect(texture).toBeDefined()
      expect(provider.layer(name)).toBe(texture)
    }
  })

  it('keeps the foreground layer from painting anything', () => {
    expect(provider.layer('foreground').frame.width).toBe(1)
  })
})

describe('parseManifest', () => {
  it('rejects an unknown version', () => {
    expect(() => parseManifest({ version: 2, districts: {} })).toThrow()
    expect(parseManifest(manifest)).toBe(manifest)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LocationId } from '@/core/contracts'
import { GREYBOX_WORLD } from './fixture'
import { PixiWorldRenderer, REDUCED_MOTION_MS, travelDurationMs, travelState } from './renderer'
import { LAYERS } from './textures'

const VIEWPORT = { width: 1170, height: 1519, dpr: 1 }

function makeRenderer() {
  return new PixiWorldRenderer({
    world: GREYBOX_WORLD,
    test: true,
    headless: true,
    viewport: VIEWPORT,
  })
}

function layerXs(renderer: PixiWorldRenderer): number[] {
  return LAYERS.map((layer) => renderer.layerContainers[layer.name].x)
}

describe('travelDurationMs', () => {
  it('stays within 0.7–1.1 s for 1–3 building hops', () => {
    for (const hops of [1, 2, 3]) {
      const ms = travelDurationMs(hops, false)
      expect(ms).toBeGreaterThanOrEqual(700 - 50)
      expect(ms).toBeLessThanOrEqual(1100 + 50)
    }
  })

  it('is a short cross-fade with reduced motion', () => {
    expect(travelDurationMs(3, true)).toBe(REDUCED_MOTION_MS)
    expect(travelDurationMs(3, true)).toBeLessThanOrEqual(200)
  })
})

describe('travelState', () => {
  it('runs beyond two buildings, walks otherwise', () => {
    expect(travelState(1)).toBe('walk')
    expect(travelState(2)).toBe('walk')
    expect(travelState(3)).toBe('run')
  })
})

describe('PixiWorldRenderer travelTo', () => {
  let renderer: PixiWorldRenderer
  beforeEach(() => {
    renderer = makeRenderer()
  })

  it('leaves every layer x an integer after travel', async () => {
    await renderer.travelTo('bank' as LocationId, { reducedMotion: false })
    for (const x of layerXs(renderer)) expect(Number.isInteger(x)).toBe(true)
    expect(Number.isInteger(renderer.layerContainers.street.x)).toBe(true)
  })

  it('moves the protagonist to the destination door and fires onArrive', async () => {
    const arrived = vi.fn()
    renderer.onArrive(arrived)
    await renderer.travelTo('clinic' as LocationId, { reducedMotion: false })
    const clinic = GREYBOX_WORLD.locations.find((l) => l.id === 'clinic')!
    expect(arrived).toHaveBeenCalledWith(clinic.id)
    const sprite = renderer.protagonistSprite
    expect(Number.isInteger(sprite.x)).toBe(true)
    expect(sprite.y).toBe(210)
  })

  it('faces right when travelling forward and left when travelling back', async () => {
    await renderer.travelTo('bank' as LocationId, { reducedMotion: false })
    expect(renderer.protagonistSprite.scale.x).toBe(1)
    await renderer.travelTo('home' as LocationId, { reducedMotion: false })
    expect(renderer.protagonistSprite.scale.x).toBe(-1)
  })

  it('rejects an unknown location', async () => {
    await expect(
      renderer.travelTo('nope' as LocationId, { reducedMotion: false }),
    ).rejects.toThrow()
  })
})

describe('PixiWorldRenderer applyVisuals', () => {
  it('recolours a building only when its variant changes', () => {
    const renderer = makeRenderer()
    const home = renderer.layerContainers.street.children.find((c) => c.label === 'home')!
    const before = home.tint
    renderer.applyVisuals({})
    expect(home.tint).toBe(before)
    renderer.applyVisuals({ home: 'upgraded' })
    expect(home.tint).not.toBe(before)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LocationId } from '@/core/contracts'
import { deriveWorldVisuals } from '@/core/worldVisuals'
import { GREYBOX_WORLD } from './fixture'
import { PixiWorldRenderer, REDUCED_MOTION_MS, travelDurationMs, travelState } from './renderer'
import { GreyboxTextureProvider, LAYERS, variantTint } from './textures'

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

  it('centres the current location in the unobscured area beside a side panel', async () => {
    await renderer.travelTo('bank' as LocationId, { reducedMotion: false })
    renderer.setSideInset(585)
    expect(renderer.protagonistSprite.x).toBe(73)
    renderer.setSideInset(0)
    expect(renderer.protagonistSprite.x).toBe(146)
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
  it('renders derived bank greetings and restores the district colour when removed', () => {
    const textures = new GreyboxTextureProvider()
    const building = vi.spyOn(textures, 'building')
    const renderer = new PixiWorldRenderer({
      world: GREYBOX_WORLD,
      textures,
      test: true,
      headless: true,
    })
    const bank = renderer.layerContainers.street.children.find((c) => c.label === 'bank')!
    const before = bank.tint
    building.mockClear()
    const visuals = deriveWorldVisuals({
      bestStars: {},
      firstStars: {},
      skills: [],
      unlockedLocations: [],
      worldFlags: { 'bank.accountOpened': 'true' },
      wallet: 0,
    })
    renderer.applyVisuals(visuals)
    expect(bank.tint).toBe(variantTint('greets'))
    expect(bank.tint).not.toBe(before)
    expect(building).toHaveBeenCalledTimes(1)
    renderer.applyVisuals(visuals)
    expect(building).toHaveBeenCalledTimes(1)
    renderer.applyVisuals({})
    expect(bank.tint).toBe(before)
    expect(building).toHaveBeenCalledTimes(2)
    renderer.destroy()
  })

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

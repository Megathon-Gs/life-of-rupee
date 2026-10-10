import { describe, expect, it } from 'vitest'
import { GREYBOX_WORLD } from './fixture'
import { GreyboxTextureProvider, variantTint } from './textures'

describe('GreyboxTextureProvider building', () => {
  it('uses location variants and the district colour when no variant is present', () => {
    const textures = new GreyboxTextureProvider()
    const bank = GREYBOX_WORLD.locations.find((location) => location.id === 'bank')!
    expect(textures.building(bank, {}).tint).toBe(0xb98c5a)
    expect(textures.building(bank, { bank: 'greets' }).tint).toBe(variantTint('greets'))
    expect(textures.building(bank, { home: 'upgraded' }).tint).toBe(0xb98c5a)
  })
})

import { WorldDefSchema, type WorldDef } from '@/core/contracts'

/**
 * The P0 street: one contiguous run of districts, urban → high-street →
 * rural-connected. `x` snap points are whole multiples of the 16 px tile grid
 * and strictly increasing (world renderer, technical implementation plan).
 */
export const world: WorldDef = WorldDefSchema.parse({
  locations: [
    {
      id: 'home',
      x: 160,
      doorX: 160,
      district: 'urban',
      buildingAsset: 'home',
      labelKey: 'loc.home',
    },
    {
      id: 'bank',
      x: 480,
      doorX: 480,
      district: 'urban',
      buildingAsset: 'bank',
      labelKey: 'loc.bank',
    },
    {
      id: 'kirana',
      x: 800,
      doorX: 800,
      district: 'high-street',
      buildingAsset: 'kirana',
      labelKey: 'loc.kirana',
    },
    {
      id: 'filler-1',
      x: 1120,
      doorX: 1120,
      district: 'high-street',
      buildingAsset: 'shop',
      labelKey: 'loc.filler1',
    },
    {
      id: 'filler-2',
      x: 1440,
      doorX: 1440,
      district: 'rural-connected',
      buildingAsset: 'house',
      labelKey: 'loc.filler2',
    },
  ],
})
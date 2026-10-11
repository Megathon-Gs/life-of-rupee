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
    {
      // P1: L4 (UPI) then L5 (fraud) are played here. Locked until the bank visit
      // would light it (unlockedBy), but entry is decoupled in the app (P1-14).
      id: 'phone-shop',
      x: 1760,
      doorX: 1760,
      district: 'rural-connected',
      buildingAsset: 'phone-shop',
      labelKey: 'loc.phone-shop',
      unlockedBy: ['l04-upi-basics'],
    },
    {
      // P1: L9 (loans) is played here; lights after the Level 5 fraud lesson.
      id: 'showroom',
      x: 2080,
      doorX: 2080,
      district: 'rural-connected',
      buildingAsset: 'showroom',
      labelKey: 'loc.showroom',
      unlockedBy: ['l05-fraud-safety'],
    },
    {
      // P1 concept: revealed by the app's capstone flag, not by any level unlock.
      id: 'capstone',
      x: 2400,
      doorX: 2400,
      district: 'rural-connected',
      buildingAsset: 'capstone',
      labelKey: 'loc.capstone',
    },
  ],
})
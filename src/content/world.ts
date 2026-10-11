import { WorldDefSchema, type WorldDef } from '@/core/contracts'

/**
 * The full twelve-level street (P0 + P1 + P2): one contiguous run of districts, urban → high-street →
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
      id: 'market',
      x: 1120,
      doorX: 1120,
      district: 'high-street',
      buildingAsset: 'market',
      labelKey: 'loc.market',
      unlockedBy: ['l05-fraud-safety'],
    },
    {
      id: 'workplace',
      x: 1440,
      doorX: 1440,
      district: 'high-street',
      buildingAsset: 'workplace',
      labelKey: 'loc.workplace',
      unlockedBy: ['l07-inflation'],
    },
    {
      id: 'filler-1',
      x: 1760,
      doorX: 1760,
      district: 'high-street',
      buildingAsset: 'shop',
      labelKey: 'loc.filler1',
    },
    {
      id: 'filler-2',
      x: 2080,
      doorX: 2080,
      district: 'rural-connected',
      buildingAsset: 'house',
      labelKey: 'loc.filler2',
    },
    // P1: L4 (UPI) then L5 (fraud) are played here; entry is decoupled in the app (P1-14).
    {
      id: 'phone-shop',
      x: 2400,
      doorX: 2400,
      district: 'rural-connected',
      buildingAsset: 'phone-shop',
      labelKey: 'loc.phone-shop',
      unlockedBy: ['l04-upi-basics'],
    },
    {
      id: 'showroom',
      x: 2720,
      doorX: 2720,
      district: 'rural-connected',
      buildingAsset: 'showroom',
      labelKey: 'loc.showroom',
      unlockedBy: ['l05-fraud-safety'],
    },
    {
      id: 'insurance-desk',
      x: 3040,
      doorX: 3040,
      district: 'rural-connected',
      buildingAsset: 'insurance-desk',
      labelKey: 'loc.insurance-desk',
      unlockedBy: ['l09-loans-emi'],
    },
    {
      id: 'learning-centre',
      x: 3360,
      doorX: 3360,
      district: 'rural-connected',
      buildingAsset: 'learning-centre',
      labelKey: 'loc.learning-centre',
      unlockedBy: ['l10-insurance'],
    },
    // Revealed by the app's capstone flag, not by any level unlock.
    {
      id: 'capstone',
      x: 3680,
      doorX: 3680,
      district: 'rural-connected',
      buildingAsset: 'capstone',
      labelKey: 'loc.capstone',
    },
  ],
})

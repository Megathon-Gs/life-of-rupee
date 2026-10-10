import type { LocationId } from '@/core/contracts'
import type { WorldDef } from '@/core/contracts'

/** Greybox fixture street used by the dev page and tests until real content lands. */
export const GREYBOX_WORLD: WorldDef = {
  locations: [
    {
      id: 'home' as LocationId,
      x: 160,
      district: 'urban',
      doorX: 160,
      buildingAsset: 'home',
      labelKey: 'loc.home',
    },
    {
      id: 'market' as LocationId,
      x: 420,
      district: 'urban',
      doorX: 420,
      buildingAsset: 'shop',
      labelKey: 'loc.market',
    },
    {
      id: 'school' as LocationId,
      x: 700,
      district: 'high-street',
      doorX: 700,
      buildingAsset: 'school',
      labelKey: 'loc.school',
    },
    {
      id: 'bank' as LocationId,
      x: 980,
      district: 'high-street',
      doorX: 980,
      buildingAsset: 'bank',
      labelKey: 'loc.bank',
    },
    {
      id: 'clinic' as LocationId,
      x: 1280,
      district: 'rural-connected',
      doorX: 1280,
      buildingAsset: 'clinic',
      labelKey: 'loc.clinic',
    },
  ],
}

import { AppConfigSchema, type AppConfig } from '@/core/contracts'

/**
 * App feature switches, kept out of saved player settings. The capstone concept
 * stays off unless the build sets `VITE_CAPSTONE=1` or a demo adds `?capstone=1`.
 */
export function readFeatures(search: string): AppConfig['features'] {
  const fromBuild = import.meta.env.VITE_CAPSTONE === '1'
  const fromQuery = new URLSearchParams(search).get('capstone') === '1'
  return AppConfigSchema.parse({ features: { capstone: fromBuild || fromQuery } }).features
}
import { db } from './db'
import { createSaveStore, type SaveMigrator } from './saveStore'

export function createProfiles(migrate: SaveMigrator) {
  const store = createSaveStore({ migrate })
  return {
    create: () => store.createProfile(),
    list: () => store.listProfiles(),
    remove: (localId: string) => store.removeProfile(localId),
  }
}

export { db }

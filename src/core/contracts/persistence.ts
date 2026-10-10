import type { SaveFile } from './save'

/** Summary of a local player shown on the start screen. */
export interface ProfileSummary {
  localId: string
  avatar: string
  displayName: string
}

/** Persistence contract; implementations (Dexie) live outside core. */
export interface SaveStore {
  load(localId: string): Promise<SaveFile | undefined>
  save(file: SaveFile): Promise<void>
  flush(): Promise<void>
  listProfiles(): Promise<ProfileSummary[]>
  createProfile(): Promise<SaveFile>
  removeProfile(localId: string): Promise<void>
}

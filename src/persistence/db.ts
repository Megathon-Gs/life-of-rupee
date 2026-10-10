import Dexie, { type EntityTable } from 'dexie'
import type { ProfileSummary, SaveFile } from '../core/contracts'

export interface SaveRow {
  localId: string
  file: SaveFile
  updatedAt: number
  // Distinguishes concurrent writes even when their timestamps are identical.
  revision?: string
}

export interface SnapshotRow {
  id?: number
  localId: string
  file: SaveFile
  createdAt: number
}

export interface QuarantineRow {
  id?: number
  localId: string
  value: unknown
  quarantinedAt: number
}

class PaisaDatabase extends Dexie {
  profiles!: EntityTable<ProfileSummary & { createdAt: number }, 'localId'>
  saves!: EntityTable<SaveRow, 'localId'>
  snapshots!: EntityTable<SnapshotRow, 'id'>
  quarantine!: EntityTable<QuarantineRow, 'id'>

  constructor() {
    super('paisa-street')
    this.version(1).stores({
      profiles: 'localId, createdAt',
      saves: 'localId, updatedAt',
      snapshots: '++id, localId, createdAt',
      quarantine: '++id, localId, quarantinedAt',
    })
  }
}

export const db = new PaisaDatabase()

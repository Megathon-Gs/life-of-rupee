import { SaveFileSchema, type SaveFile } from '../../contracts'

/** Latest save schema version; bump with a new numbered migration. */
export const CURRENT_SCHEMA_VERSION = 1

/** Thrown when a save cannot be brought to the current schema version. */
export class MigrationError extends Error {
  constructor(
    message: string,
    readonly fromVersion: unknown,
  ) {
    super(message)
    this.name = 'MigrationError'
  }
}

type Migration = (save: Record<string, unknown>) => Record<string, unknown>

/** Numbered migrations: key N upgrades a version-N save to N+1. v1 is the baseline (none yet). */
export const migrations: Readonly<Record<number, Migration>> = {}

/** Upgrade a raw saved value to the current version and validate it as a `SaveFile`. */
export function migrate(raw: unknown): SaveFile {
  if (typeof raw !== 'object' || raw === null)
    throw new MigrationError('Save is not an object', undefined)
  let save = raw as Record<string, unknown>
  let version = save.schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1)
    throw new MigrationError('Save has no valid schemaVersion', version)
  if (version > CURRENT_SCHEMA_VERSION)
    throw new MigrationError(
      `Save version ${version} is newer than ${CURRENT_SCHEMA_VERSION}`,
      version,
    )
  const from = version
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = migrations[version]
    if (!step) throw new MigrationError(`No migration path from version ${version}`, from)
    save = { ...step(save), schemaVersion: version + 1 }
    version += 1
  }
  const parsed = SaveFileSchema.safeParse(save)
  if (!parsed.success)
    throw new MigrationError(`Migrated save is invalid: ${parsed.error.message}`, from)
  return parsed.data
}

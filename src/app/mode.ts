/** How the app was launched, read once from the URL. */
export interface AppMode {
  /** `?test=1`: fixed seed, deterministic world, fixture levels. */
  test: boolean
  /** `?test=1&fixtures=only`: register fixture levels only, ignoring real content. */
  fixturesOnly: boolean
}

/** Parses the launch mode from a query string. */
export function readMode(search: string): AppMode {
  const params = new URLSearchParams(search)
  const test = params.get('test') === '1'
  return { test, fixturesOnly: test && params.get('fixtures') === 'only' }
}

/** Seed used for every level in test mode. */
export const TEST_SEED = 1

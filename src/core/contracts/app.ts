import { z } from 'zod'

/** App-level feature switches, separate from saved player settings. */
export const AppConfigSchema = z
  .object({ features: z.object({ capstone: z.boolean() }).strict() })
  .strict()
/** Capstone visibility is explicitly enabled by the app, never by player progress. */
export type AppConfig = z.infer<typeof AppConfigSchema>

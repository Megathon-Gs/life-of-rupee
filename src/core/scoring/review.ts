import type { ErrorCategoryDef, InteractionEvent, ReviewItem } from '../contracts'
import { errorCategories } from './errorCategories'

const severityOrder = { critical: 0, major: 1, minor: 2 }

export function reviewItems(
  events: readonly InteractionEvent[],
  definitions: Readonly<Record<string, ErrorCategoryDef>> = errorCategories,
): ReviewItem[] {
  const items = new Map<string, ReviewItem>()
  for (const event of events) {
    if (event.kind !== 'choice' || event.correct || !event.error) continue
    const definition = definitions[event.error]
    if (!definition) throw new Error(`Unknown error category: ${event.error}`)
    const severity = event.severity ?? definition.severity
    const previous = items.get(event.error)
    if (!previous || severityOrder[severity] < severityOrder[previous.severity]) {
      items.set(event.error, {
        error: event.error,
        severity,
        skillNode: definition.skillNode,
        reviewKey: definition.reviewKey,
      })
    }
  }
  return [...items.values()].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

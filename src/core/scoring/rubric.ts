import type { InteractionEvent, Rubric, ScoreInput, ScoreResult } from '../contracts'
import { errorCategories } from './errorCategories'
import { reviewItems } from './review'

export const defaultRubric: Rubric = {
  penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
  twoStarMaxPenalty: 2,
  criticalCap: 1,
  transferCap: 2,
  decisionStepId: 'decision',
  transferStepId: 'transfer',
}

export function score(input: ScoreInput): ScoreResult
export function score(events: readonly InteractionEvent[], rubric: Rubric): ScoreResult
export function score(
  input: ScoreInput | readonly InteractionEvent[],
  levelRubric: Rubric = defaultRubric,
): ScoreResult {
  const { events, rubric, errorDefs } =
    'events' in input
      ? input
      : { events: input, rubric: levelRubric, errorDefs: Object.values(errorCategories) }
  const definitions = Object.fromEntries(
    errorDefs.map((definition) => [definition.code, definition]),
  )
  const reviews = reviewItems(events, definitions)
  let penalty = 0
  let decisionCorrect = false
  let firstTransferCorrect: boolean | undefined
  let criticalOccurred = false
  const unresolvedSteps = new Set<string>()

  for (const event of events) {
    if (event.kind === 'hint') {
      penalty += event.level === 1 ? rubric.penaltyWeights.hint1 : rubric.penaltyWeights.hint2
    } else if (event.kind === 'choice') {
      if (event.stepId === rubric.transferStepId && firstTransferCorrect === undefined) {
        firstTransferCorrect = event.correct
      }
      if (event.correct) {
        if (event.stepId === rubric.decisionStepId) decisionCorrect = true
        unresolvedSteps.delete(event.stepId)
      } else {
        const severity =
          event.severity ?? (event.error ? definitions[event.error]?.severity : undefined)
        if (!severity) throw new Error(`Missing severity for wrong choice on step: ${event.stepId}`)
        if (severity === 'critical') {
          criticalOccurred = true
          unresolvedSteps.add(event.stepId)
        } else {
          penalty += rubric.penaltyWeights[severity]
        }
      }
    }
  }

  let stars: ScoreResult['stars'] = penalty === 0 ? 3 : penalty <= rubric.twoStarMaxPenalty ? 2 : 1
  const capsApplied: ScoreResult['capsApplied'] = []
  if (!decisionCorrect || unresolvedSteps.size > 0) {
    stars = 0
    capsApplied.push('incomplete')
  }
  if (firstTransferCorrect === false) {
    if (stars > rubric.transferCap) stars = rubric.transferCap
    capsApplied.push('transfer')
  }
  if (criticalOccurred) {
    if (stars > rubric.criticalCap) stars = rubric.criticalCap
    capsApplied.push('critical')
  }
  return { stars, penalty, capsApplied, reviewItems: reviews }
}

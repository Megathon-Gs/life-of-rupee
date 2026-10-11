import { describe, expect, it } from 'vitest'
import type { InteractionEvent, LevelDef, Severity } from '@/core/contracts'
import { score } from '@/core/scoring'
import { levels } from './index'

type Config = Record<string, unknown>
interface Wrong {
  error?: string
  severity?: Severity
}

const list = (value: unknown) => (Array.isArray(value) ? (value as Config[]) : [])

/** Every wrong answer an interaction can report for a config, mirroring each component. */
function wrongAnswers(interaction: string, config: Config): Wrong[] {
  switch (interaction) {
    case 'documentInspector':
      return list(config.fields)
        .filter((field) => !field.isAnswer)
        .map((field) => ({ error: field.error as string | undefined }))
    case 'formFiller':
      return list(config.fields).flatMap((field) =>
        list(field.options)
          .filter((option) => option.id !== field.correctOptionId)
          .map(() => ({ error: field.error as string | undefined })),
      )
    case 'upiPayment':
      return list(config.choices)
        .filter((choice) => choice.id !== config.correctChoiceId)
        .map((choice) => ({ error: choice.error as string, severity: choice.severity as Severity }))
    case 'offerComparator':
      return list(config.offers)
        .filter((offer) => offer.id !== config.correctOfferId)
        .map((offer) => ({ error: offer.error as string, severity: offer.severity as Severity }))
    case 'messageTriage':
      return list(config.messages).map((message) => ({
        error: message.error as string | undefined,
        severity: message.severity as Severity | undefined,
      }))
    case 'budgetAllocator': {
      const errors = config.errors as { noEssentials: string; noSavings: string }
      return [
        { error: errors.noEssentials, severity: 'major' },
        { error: errors.noSavings, severity: 'minor' },
      ]
    }
    case 'receiptInspector': {
      const errors = config.errors as { missedTax: string; discountBeforeTax: string }
      return [
        { error: errors.missedTax, severity: 'major' },
        { error: errors.discountBeforeTax, severity: 'major' },
      ]
    }
    case 'timeSlider':
      return [
        { error: config.error as string | undefined, severity: 'major' },
        ...list(config.choices)
          .filter((choice) => choice.id !== config.correctChoiceId)
          .map((choice) => ({
            error: (choice.error ?? config.error) as string | undefined,
            severity: (choice.severity ?? 'major') as Severity,
          })),
      ]
    case 'scenarioChain':
      return list(config.links).flatMap((link) =>
        wrongAnswers(link.interaction as string, link.config as Config),
      )
    default:
      throw new Error(`No wrong-answer model for interaction ${interaction}`)
  }
}

/** Every interactive config a level can show: lesson, decision (and overrides), transfers. */
function configs(level: LevelDef) {
  const [, lesson, , decision, , transfer] = level.steps
  return [
    { stepId: lesson.id, interaction: lesson.interaction, config: lesson.config },
    { stepId: decision.id, interaction: decision.interaction, config: decision.config },
    ...(decision.configOverrides ?? []).map((override) => ({
      stepId: decision.id,
      interaction: decision.interaction,
      config: override.config,
    })),
    ...transfer.variants.map((variant) => ({
      stepId: transfer.id,
      interaction: variant.interaction,
      config: variant.config,
    })),
  ] as { stepId: string; interaction: string; config: Config }[]
}

describe('every level can be scored after any mistake', () => {
  for (const level of levels) {
    it(`${level.id}: each wrong answer is gradable`, () => {
      const rubric = level.steps[3].rubric
      for (const { stepId, interaction, config } of configs(level)) {
        for (const wrong of wrongAnswers(interaction, config)) {
          const events: InteractionEvent[] = [
            { kind: 'choice', stepId, correct: false, ...wrong } as InteractionEvent,
            { kind: 'choice', stepId, correct: true },
          ]
          expect(
            () => score(events, rubric),
            `${level.id} ${stepId} ${interaction} wrong=${JSON.stringify(wrong)}`,
          ).not.toThrow()
        }
      }
    })
  }
})

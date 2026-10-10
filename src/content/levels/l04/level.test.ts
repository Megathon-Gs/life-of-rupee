import { describe, expect, it } from 'vitest'
import { UpiPaymentConfigSchema, type InteractionEvent, type UpiPaymentConfig } from '@/core/contracts'
import { errorCategories, score } from '@/core/scoring'
import { createLevelRunner } from '@/level-runner'
import { i18n } from '@/i18n'
import { level } from './level'
import { sources } from './sources'
import en from '../../locales/en/l04.json'
import te from '../../locales/te/l04.json'

const lesson = UpiPaymentConfigSchema.parse(level.steps[1].config)
const decision = UpiPaymentConfigSchema.parse(level.steps[3].config)
const transfers = level.steps[5].variants.map(variant => UpiPaymentConfigSchema.parse(variant.config))
const rubric = level.steps[3].rubric

function textKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, text]) => typeof text === 'string'
    ? [`${prefix}${key}`]
    : textKeys(text as Record<string, unknown>, `${prefix}${key}.`))
}

function choose(config: UpiPaymentConfig, stepId: string, choiceId = config.correctChoiceId): InteractionEvent {
  const choice = config.choices.find(choice => choice.id === choiceId)!
  const correct = choiceId === config.correctChoiceId
  return { kind: 'choice', stepId, correct, ...(!correct ? { error: choice.error, severity: choice.severity } : {}) }
}

const safeLesson = choose(lesson, 'lesson')
const safeDecision = choose(decision, 'decision')

describe('Level 4 UPI content', () => {
  it.each(transfers)('scores clean play at 3 stars and the corrected decision mistake at 2 ($payeeNameKey)', transfer => {
    const safeTransfer = choose(transfer, 'transfer')
    const clean = [safeLesson, safeDecision, safeTransfer]
    expect(score(clean, rubric).stars).toBe(3)
    expect(score([safeLesson, choose(decision, 'decision', 'decline'), safeDecision, safeTransfer], rubric)).toMatchObject({
      stars: 2, penalty: 1,
      reviewItems: [{ error: 'upi.declined_payment', severity: 'minor', skillNode: 'bank.upi', reviewKey: 'upi.declined_payment.review' }],
    })
    expect(score([safeLesson, safeDecision, choose(transfer, 'transfer', 'approve'), safeTransfer], rubric)).toMatchObject({
      stars: 2, capsApplied: ['transfer'],
      reviewItems: [{ error: 'upi.wrong_payee', severity: 'major', skillNode: 'bank.upi' }],
    })
  })

  it('treats PIN-to-receive as critical, unresolved at 0 stars and corrected at most 1', () => {
    const mistake = choose(lesson, 'lesson', 'approve')
    expect(mistake).toMatchObject({ correct: false, error: 'upi.pin_to_receive', severity: 'critical' })
    expect(score([mistake, safeDecision, choose(transfers[0]!, 'transfer')], rubric).stars).toBe(0)
    expect(score([mistake, safeLesson, safeDecision, choose(transfers[0]!, 'transfer')], rubric)).toMatchObject({
      stars: 1, capsApplied: ['critical'],
      reviewItems: [{ error: 'upi.pin_to_receive', severity: 'critical', skillNode: 'bank.upi' }],
    })
  })

  it.each([
    { mistake: false, seed: 0 }, { mistake: true, seed: 0 },
    { mistake: false, seed: 1 }, { mistake: true, seed: 1 },
  ])('completes all six steps in the real runner (mistake: $mistake, seed: $seed)', ({ mistake, seed }) => {
    const runner = createLevelRunner({ levels: [level], newId: () => 'l04-test-attempt' })
    let stars: number | undefined
    runner.onComplete(result => { stars = result.score.stars })
    runner.start(level, seed, () => '2026-10-10T00:00:00Z')
    expect(runner.advance()).toBe(true)
    expect(runner.dispatch(safeLesson)).toBe(true)
    expect(runner.complete()).toBe(true)
    expect(runner.arrive(level.location)).toBe(true)
    if (mistake) {
      expect(runner.dispatch(choose(decision, 'decision', 'decline'))).toBe(true)
      expect(runner.current().stepIndex).toBe(3)
    }
    expect(runner.dispatch(safeDecision)).toBe(true)
    expect(runner.complete()).toBe(true)
    expect(runner.advance()).toBe(true)
    const view = runner.current().view
    expect(view?.type).toBe('transfer')
    if (view?.type !== 'transfer') throw new Error('Expected transfer view')
    expect(runner.dispatch(choose(UpiPaymentConfigSchema.parse(view.config), 'transfer'))).toBe(true)
    expect(runner.complete()).toBe(true)
    expect(runner.current().done).toBe(true)
    expect(stars).toBe(mistake ? 2 : 3)
  })

  it('blocks an always-decline strategy at the mandatory verified payment', () => {
    const runner = createLevelRunner({ levels: [level], newId: () => 'l04-decline-attempt' })
    runner.start(level, 0, () => '2026-10-10T00:00:00Z')
    runner.advance()
    runner.dispatch(safeLesson)
    runner.complete()
    runner.arrive(level.location)
    runner.dispatch(choose(decision, 'decision', 'decline'))
    expect(runner.current().stepIndex).toBe(3)
    expect(runner.current().done).toBe(false)
    expect(score(runner.current().events, rubric).stars).toBe(0)
    runner.dispatch(safeDecision)
    runner.complete()
    expect(runner.current().stepIndex).toBe(4)
    expect(decision.choices.find(choice => choice.id === decision.correctChoiceId)!.action).toBe('enterPin')
    const recipient = i18n.t(decision.payeeNameKey).split(' —')[0]!
    expect(i18n.t(decision.promptKey)).toContain(recipient)
    expect(i18n.t(decision.promptKey)).toContain(i18n.t(decision.payeeHandleKey))
  })

  it('uses different payees, amounts and choice positions in its two mismatch variants', () => {
    expect(level.steps[0].lineKeys.length).toBeLessThanOrEqual(3)
    expect(level.steps[2].location).toBe('phone-shop')
    expect(transfers).toHaveLength(2)
    expect(new Set([decision, ...transfers].map(config => config.amountPaise)).size).toBe(3)
    expect(new Set([decision, ...transfers].map(config => i18n.t(config.payeeHandleKey))).size).toBe(3)
    expect(transfers.map(config => config.choices[0]!.id)).toEqual(['approve', 'decline'])
    for (const config of [lesson, ...transfers]) {
      expect(config.choices.find(choice => choice.id === config.correctChoiceId)!.action).toBe('decline')
    }
    for (const config of [lesson, decision, ...transfers]) {
      for (const choice of config.choices) {
        if (!choice.error) continue
        expect(errorCategories[choice.error]).toMatchObject({ severity: choice.severity, skillNode: level.skillNodes[0] })
        for (const lng of ['en', 'te']) {
          expect(i18n.exists(errorCategories[choice.error]!.reviewKey, { lng, ns: 'l04', fallbackLng: false })).toBe(true)
        }
      }
    }
    for (const [index, name] of ['leela', 'kavi'].entries()) {
      const text = en.transfer[name as 'leela' | 'kavi']
      const displayedName = i18n.t(transfers[index]!.payeeNameKey).split(' —')[0]!
      expect(text.prompt).not.toContain(`${displayedName},`)
      expect(text.explanation).toContain(displayedName)
    }
  })

  it('resolves all player-facing keys in both languages and records translation status', () => {
    const check = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te']) expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) {
        for (const item of value) check(item, property)
      } else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) check(item, key)
      }
    }
    check(level)
    expect(textKeys(te).sort()).toEqual(textKeys(en).sort())
    for (const locale of [en, te]) expect(locale._meta.translationStatus.trim()).not.toBe('')
  })

  it('sources every financial explanation, hint and review with review metadata', () => {
    const sourceIds = new Set(sources.map(source => source.id))
    const claimedKeys = new Set(level.claims.map(claim => claim.textKey))
    for (const key of textKeys(en)) {
      if (key.endsWith('review') || key.endsWith('hint1') || key.endsWith('hint2') || (key.endsWith('explanation') && !key.startsWith('consequence.'))) {
        expect(claimedKeys.has(`l04:${key}`), key).toBe(true)
      }
    }
    for (const claim of level.claims) {
      expect(claim.sourceIds.length).toBeGreaterThan(0)
      for (const sourceId of claim.sourceIds) expect(sourceIds.has(sourceId)).toBe(true)
      expect(claim.reviewerRole.trim()).not.toBe('')
      expect(claim.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(claim.reviewedOn))).toBe(false)
    }
    for (const source of sources) {
      expect(new URL(source.url).hostname).toBe('www.bhimupi.org.in')
      expect(source.retrievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('contains no real-looking phone, Aadhaar, PAN, IFSC or provider handle', () => {
    const serialized = JSON.stringify([level, en, te])
    expect(serialized).not.toMatch(/(?:\+91[\s-]?)?\b[6-9]\d{9}\b/)
    expect(serialized).not.toMatch(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{5}\d{4}[A-Z]\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{4}0[A-Z0-9]{6}\b/)
    const handles = serialized.match(/[a-z0-9.-]+@[a-z0-9]+(?:[.-][a-z0-9]+)*/gi) ?? []
    expect(handles.length).toBeGreaterThan(0)
    for (const handle of handles) expect(handle.endsWith('@demo.invalid'), handle).toBe(true)
  })
})

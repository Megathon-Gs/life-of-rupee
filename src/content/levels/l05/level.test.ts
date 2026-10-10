import { describe, expect, it } from 'vitest'
import { MessageTriageConfigSchema } from '@/core/contracts'
import { errorCategories, score } from '@/core/scoring'
import { i18n } from '@/i18n'
import { level } from './level'
import { sources } from './sources'
import en from '../../locales/en/l05.json'
import te from '../../locales/te/l05.json'

const rubric = level.steps[3].rubric
const transferCorrect = { kind: 'choice' as const, stepId: 'transfer', correct: true }
const decisionCorrect = { kind: 'choice' as const, stepId: 'decision', correct: true }

const lesson = MessageTriageConfigSchema.parse(level.steps[1].config)
const decision = MessageTriageConfigSchema.parse(level.steps[3].config)
const variants = level.steps[5].variants
const transfers = variants.map(variant => MessageTriageConfigSchema.parse(variant.config))
const allMessages = [lesson, decision, ...transfers].flatMap(config => config.messages)

const wrong = (stepId: string, error: string | undefined) => ({ kind: 'choice' as const, stepId, correct: false, error })

describe('Level 5 scoring', () => {
  it('scores a clean path at 3 stars', () => {
    expect(score([decisionCorrect, transferCorrect], rubric).stars).toBe(3)
  })

  it('scores the documented corrected mistake path at 2 stars with a safety.fraud review item', () => {
    const safeNotice = decision.messages.find(message => message.correctClassification === 'safe')!
    expect(safeNotice.error).toBe('fraud.misclassified')
    const mistake = wrong('decision', safeNotice.error)
    const result = score([mistake, decisionCorrect, transferCorrect], rubric)
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([{ error: 'fraud.misclassified', skillNode: 'safety.fraud' }])
    expect(level.skillNodes).toEqual(['safety.fraud'])
  })

  it('caps a corrected OTP/PIN share at 1 star and leaves it unresolved at 0', () => {
    const corrected = score([wrong('decision', 'fraud.shared_otp'), decisionCorrect, transferCorrect], rubric)
    expect(corrected.stars).toBe(1)
    expect(corrected.capsApplied).toContain('critical')
    expect(corrected.reviewItems).toMatchObject([{ error: 'fraud.shared_otp', severity: 'critical', skillNode: 'safety.fraud' }])
    expect(score([wrong('decision', 'fraud.shared_otp'), transferCorrect], rubric).stars).toBe(0)
  })

  it('treats paying a fraud request as critical', () => {
    const result = score([wrong('decision', 'fraud.paid_request'), decisionCorrect, transferCorrect], rubric)
    expect(result.stars).toBe(1)
    expect(result.reviewItems).toMatchObject([{ error: 'fraud.paid_request', severity: 'critical' }])
  })

  it('covers the required error classes in the decision', () => {
    const byError = Object.fromEntries(decision.messages.map(message => [message.error, message]))
    expect(byError['fraud.shared_otp']).toMatchObject({ correctClassification: 'fraud', severity: 'critical' })
    expect(byError['fraud.paid_request']).toMatchObject({ correctClassification: 'fraud', severity: 'critical' })
    expect(byError['fraud.clicked_link']).toMatchObject({ correctClassification: 'fraud', severity: 'major' })
    expect(byError['fraud.misclassified']).toMatchObject({ correctClassification: 'safe', severity: 'minor' })
  })

  it('uses registered errors, matching severities and localized review cards in every message', () => {
    for (const message of allMessages) {
      const definition = errorCategories[message.error]
      expect(definition, message.error).toBeDefined()
      expect(definition!.severity).toBe(message.severity)
      expect(definition!.skillNode).toBe('safety.fraud')
      const result = score([wrong('decision', message.error), decisionCorrect, transferCorrect], rubric)
      expect(result.reviewItems[0]!.reviewKey).toBe(definition!.reviewKey)
      for (const lng of ['en', 'te']) {
        expect(i18n.exists(definition!.reviewKey, { lng, ns: 'l05', fallbackLng: false }), `${lng} ${definition!.reviewKey}`).toBe(true)
      }
    }
  })

  it('tests transfer with at least two different messageTriage variants that keep the urgency cue', () => {
    expect(variants.length).toBeGreaterThanOrEqual(2)
    expect(new Set(variants.map(variant => variant.id)).size).toBe(variants.length)
    for (const variant of variants) expect(variant.interaction).toBe('messageTriage')
    expect(new Set(transfers.map(config => JSON.stringify(config))).size).toBe(transfers.length)
    const bodies = transfers.map(config => config.messages.map(message => message.bodyKey).join())
    expect(new Set(bodies).size).toBe(transfers.length)
    expect(transfers[0]!.messages.some(message => message.warningSigns.some(sign => sign.id === 'urgency'))).toBe(true)
    for (const config of transfers) {
      expect(config.messages.some(message => message.correctClassification === 'fraud')).toBe(true)
      expect(config.messages.some(message => message.correctClassification === 'safe')).toBe(true)
      const result = score([decisionCorrect, wrong('transfer', config.messages[0]!.error), transferCorrect], rubric)
      expect(result.capsApplied).toContain('transfer')
      expect(result.stars).toBeLessThanOrEqual(2)
    }
  })

  it('sets the fraud warning world flag read by Level 9', () => {
    expect(level.worldEffects).toContainEqual({ key: 'fraud.seenWarningSigns', value: 'true' })
  })

  it('keeps the level shape: id, location, travel and decision step ids', () => {
    expect(level.id).toBe('l05-fraud-safety')
    expect(level.location).toBe('phone-shop')
    expect(level.steps[0].lineKeys.length).toBeLessThanOrEqual(3)
    expect(level.steps[2]).toMatchObject({ type: 'travel', location: 'phone-shop' })
    expect(level.steps[3].id).toBe(rubric.decisionStepId)
    expect(level.steps[5].id).toBe(rubric.transferStepId)
  })
})

describe('Level 5 content', () => {
  it('resolves every player-facing key in English and Telugu', () => {
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
    check([lesson, decision, ...transfers])
  })

  it('backs every claim with a known l05 source and an educator review stamp', () => {
    const ids = new Set<string>(sources.map(source => source.id))
    expect(ids.size).toBe(sources.length)
    for (const claim of level.claims) {
      expect(claim.sourceIds.length).toBeGreaterThan(0)
      for (const id of claim.sourceIds) expect(ids.has(id), id).toBe(true)
      expect(claim.reviewerRole).toBe('NGO educator (user approval)')
      for (const lng of ['en', 'te']) expect(i18n.exists(claim.textKey, { lng, fallbackLng: false }), claim.textKey).toBe(true)
    }
    for (const source of sources) expect(source.retrievedOn).toBe('2026-10-10')
  })

  it('records the approved machine-assisted Telugu text', () => {
    expect(te._meta.translationStatus.toLowerCase()).toContain('machine-assisted')
    expect(te._meta.translationStatus).toContain('approved by NGO educator')
  })

  it('keeps identical key sets in English and Telugu', () => {
    const flatten = (value: unknown, prefix = ''): string[] =>
      value && typeof value === 'object'
        ? Object.entries(value).flatMap(([key, item]) => flatten(item, prefix ? `${prefix}.${key}` : key))
        : [prefix]
    expect(flatten(te).sort()).toEqual(flatten(en).sort())
  })

  it('contains no real-looking phone numbers, Aadhaar, PAN, IFSC or real-provider UPI handles', () => {
    const serialized = JSON.stringify([level, en, te])
    expect(serialized).not.toMatch(/\b[6-9]\d{9}\b/)
    expect(serialized).not.toMatch(/(?:\+|\b00)?91[\s-]?[6-9]\d{4}[\s-]?\d{5}\b/)
    expect(serialized).not.toMatch(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/)
    expect(serialized).not.toMatch(/\b\d{12}\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{4}0[A-Z0-9]{6}\b/)
    expect(serialized).not.toMatch(/@(ok(sbi|hdfcbank|icici|axis)|ybl|paytm|upi|apl|ibl|axl)\b/i)
  })

  it('uses only fictional, obviously demo handles', () => {
    for (const handle of JSON.stringify([en, te]).match(/[a-z0-9.]+@[a-z0-9]+/gi) ?? []) {
      expect(handle).toMatch(/@demo$/)
    }
  })
})

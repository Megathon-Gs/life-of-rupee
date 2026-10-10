import { describe, expect, it } from 'vitest'
import { DocumentInspectorConfigSchema, FormFillerConfigSchema } from '@/core/contracts'
import { errorCategories, score } from '@/core/scoring'
import { i18n } from '@/i18n'
import { level } from './level'
import en from '../../locales/en/l02.json'
import te from '../../locales/te/l02.json'

const rubric = level.steps[3].rubric
const transferCorrect = { kind: 'choice' as const, stepId: 'transfer', correct: true }
const decisionCorrect = { kind: 'choice' as const, stepId: 'decision', correct: true }

describe('Level 2 scoring', () => {
  it('scores the documented corrected mistake path at 2 stars and a clean path at 3', () => {
    const config = FormFillerConfigSchema.parse(level.steps[3].config)
    const mistake = { kind: 'choice' as const, stepId: 'decision', correct: false, error: config.fields[0]!.error }
    const result = score([mistake, decisionCorrect, transferCorrect], rubric)
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([{ error: mistake.error, skillNode: level.skillNodes[0] }])
    expect(score([decisionCorrect, transferCorrect], rubric).stars).toBe(3)
  })

  it('uses registered errors and localized review cards in every interaction', () => {
    const form = FormFillerConfigSchema.parse(level.steps[3].config)
    const lesson = DocumentInspectorConfigSchema.parse(level.steps[1].config)
    const transfers = level.steps[5].variants.map(variant => FormFillerConfigSchema.parse(variant.config))
    for (const field of [...form.fields, ...lesson.fields, ...transfers.flatMap(config => config.fields)]) {
      if (!field.error) continue
      const result = score([
        { kind: 'choice', stepId: 'decision', correct: false, error: field.error },
        decisionCorrect, transferCorrect,
      ], rubric)
      expect(result.reviewItems[0]!.reviewKey).toBe(errorCategories[field.error]!.reviewKey)
      for (const lng of ['en', 'te']) {
        expect(i18n.exists(result.reviewItems[0]!.reviewKey, { lng, ns: 'l02', fallbackLng: false })).toBe(true)
      }
    }
  })

  it('keeps account-route and identity mistakes in separate review cards', () => {
    const config = FormFillerConfigSchema.parse(level.steps[3].config)
    const result = score([
      ...config.fields.map(field => ({ kind: 'choice' as const, stepId: 'decision', correct: false, error: field.error })),
      decisionCorrect, transferCorrect,
    ], rubric)
    expect(result.stars).toBe(1)
    expect(result.reviewItems.map(item => item.error).sort()).toEqual(['bank.wrong_document', 'kyc.wrong_document'])
    expect(result.reviewItems.map(item => item.reviewKey)).toHaveLength(2)
    expect(en.bank.wrong_document.review).not.toContain('Aadhaar')
    expect(en.kyc.wrong_document.review).not.toContain('account route')
  })

  it('tests transfer with different people, documents and correct option positions', () => {
    const variants = level.steps[5].variants
    expect(variants).toHaveLength(2)
    const configs = variants.map(variant => FormFillerConfigSchema.parse(variant.config))
    expect(configs.map(config => config.fields[0]!.correctOptionId)).toEqual(['minor', 'adult'])
    expect(configs.map(config => config.fields[1]!.correctOptionId)).toEqual(['passport', 'voterId'])
    expect(en.transfer.tara.title).toContain('16')
    expect(en.transfer.arun.title).toContain('21')
    for (const [index, config] of configs.entries()) {
      expect(variants[index]!.interaction).toBe('formFiller')
      for (const field of config.fields) {
        expect(field.options.filter(option => option.id === field.correctOptionId)).toHaveLength(1)
        expect(field.options.some(option => option.id !== field.correctOptionId)).toBe(true)
        const result = score([
          decisionCorrect,
          { kind: 'choice', stepId: 'transfer', correct: false, error: field.error },
          transferCorrect,
        ], rubric)
        expect(result.stars).toBe(2)
        expect(result.capsApplied).toContain('transfer')
      }
      expect(score([decisionCorrect, transferCorrect], rubric).stars).toBe(3)
    }
  })

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
  })

  it('contains no real-looking Aadhaar, PAN or IFSC number strings', () => {
    const serialized = JSON.stringify([level, en, te])
    expect(serialized).not.toMatch(/\b\d{12}\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{4}0[A-Z0-9]{6}\b/)
  })
})

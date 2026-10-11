import { describe, expect, it } from 'vitest'
import {
  OfferComparatorConfigSchema,
  TimeSliderConfigSchema,
  type InteractionEvent,
  type LevelCompletion,
} from '@/core/contracts'
import { compound } from '@/core/finance/interest'
import { rupees } from '@/core/finance/money'
import { errorCategories, score } from '@/core/scoring'
import { i18n } from '@/i18n'
import { createLevelRunner } from '@/level-runner/runner'
import en from '../../locales/en/l11.json'
import te from '../../locales/te/l11.json'
import { level } from './level'
import { sources } from './sources'

const lesson = TimeSliderConfigSchema.parse(level.steps[1].config)
const decision = OfferComparatorConfigSchema.parse(level.steps[3].config)
const transfers = level.steps[5].variants.map((variant) =>
  OfferComparatorConfigSchema.parse(variant.config),
)
const correct = (stepId: string): InteractionEvent => ({ kind: 'choice', stepId, correct: true })
const textKeys = (value: object, prefix = ''): string[] =>
  Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof item === 'string' ? [path] : textKeys(item, path)
  })
const wrong = (config: typeof decision, id: string, stepId: string): InteractionEvent => {
  const offer = config.offers.find((item) => item.id === id)!
  return { kind: 'choice', stepId, correct: false, error: offer.error, severity: offer.severity }
}

describe('Level 11', () => {
  it('validates its local sources, claims, configs and bilingual strings without registration', () => {
    expect(textKeys(en).sort()).toEqual(textKeys(te).sort())
    const sourceIds = new Set(sources.map((source) => source.id))
    for (const claim of level.claims) {
      expect(claim.sourceIds.length).toBeGreaterThan(0)
      for (const id of claim.sourceIds) expect(sourceIds.has(id), id).toBe(true)
    }
    const check = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te'])
          expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) value.forEach((item) => check(item, property))
      else if (value && typeof value === 'object')
        Object.entries(value).forEach(([key, item]) => check(item, key))
    }
    check(level)
    expect(level.id).toBe('l11-investing')
    expect(level.location).toBe('learning-centre')
    expect(level.steps[2].location).toBe(level.location)
    expect(lesson.correctChoiceId).toBe('assumption')
    expect(lesson.annualInflationPct).toBeDefined() // activates TimeSlider range mode
    expect(decision.correctOfferId).toBe('mutualFunds')
    for (const config of [decision, ...transfers]) {
      expect(config.investmentInstruments?.map((item) => item.id)).toEqual([
        'fd',
        'bonds',
        'mutualFunds',
        'equities',
      ])
    }
    expect(transfers).toHaveLength(2)
    expect(transfers.every((config) => config.correctOfferId === 'fd')).toBe(true)
    expect(te._meta.translationStatus).toContain('ఆమోదించబడింది')
    expect(level.claims.every((claim) => claim.reviewerRole.includes('sign-off pending'))).toBe(
      true,
    )
  })

  it('covers instrument facts, feedback and correct statements with traceable claims', () => {
    const claims = new Set(level.claims.map((claim) => claim.textKey))
    for (const instrument of decision.investmentInstruments!) {
      for (const key of [instrument.riskKey, instrument.liquidityKey, instrument.timeHorizonKey])
        expect(claims.has(key), key).toBe(true)
    }
    for (const key of [
      'hook.2',
      'hook.3',
      'lesson.prompt',
      'lesson.hint1',
      'lesson.explanation',
      'lesson.assumption',
      'decision.mutualFunds',
      'decision.explanation',
      'compare.hint1',
      'compare.hint2',
      'consequence.explanation',
      'transfer.books.explanation',
      'transfer.course.explanation',
    ])
      expect(claims.has(`l11:${key}`), key).toBe(true)
    const used = new Set([
      lesson.error,
      ...[decision, ...transfers]
        .flatMap((config) => config.offers.map((offer) => offer.error))
        .filter(Boolean),
    ])
    expect([...used].sort()).toEqual([
      'investing.concentrated_risk',
      'investing.guaranteed_return',
      'investing.ignored_horizon',
    ])
    for (const code of used) {
      const definition = errorCategories[code!]!
      expect(definition.skillNode).toBe(level.skillNodes[0])
      expect(claims.has(`l11:${definition.reviewKey}`)).toBe(true)
      for (const lng of ['en', 'te'])
        expect(i18n.exists(definition.reviewKey, { lng, ns: 'l11', fallbackLng: false })).toBe(true)
    }
    for (const source of sources) {
      expect(['investor.sebi.gov.in', 'ncfe.org.in']).toContain(new URL(source.url).hostname)
      expect(source.retrievedOn).toBe('2026-10-11')
    }
  })

  it('scores clean, scripted-mistake and corrected transfer paths with the real scorer', () => {
    const events = [correct('lesson'), correct('decision'), correct('transfer')]
    expect(score(events, level.steps[3].rubric).stars).toBe(3)
    const result = score(
      [wrong(decision, 'equities', 'decision'), ...events],
      level.steps[3].rubric,
    )
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([
      {
        error: 'investing.concentrated_risk',
        reviewKey: 'investing.concentrated_risk.review',
        skillNode: 'growth.investing',
      },
    ])
    for (const config of transfers)
      expect(
        score(
          [correct('decision'), wrong(config, 'bonds', 'transfer'), correct('transfer')],
          level.steps[3].rubric,
        ).stars,
      ).toBe(2)
  })

  it('completes both seeded variants with correct stars and survives a mid-decision reload', () => {
    const seen = new Set<string>()
    for (let seed = 0; seed < 20; seed++)
      for (const mistake of [false, true]) {
        const completions: LevelCompletion[] = []
        const now = () => '2026-10-11T01:00:00.000Z'
        const deps = { levels: [level], newId: () => `attempt-${seed}`, now }
        const runner = createLevelRunner(deps)
        runner.start(level, seed, now)
        runner.advance()
        runner.dispatch(correct('lesson'))
        runner.complete()
        expect(runner.arrive('bank' as typeof level.location)).toBe(false)
        runner.arrive(level.location)
        if (mistake) runner.dispatch(wrong(decision, 'equities', 'decision'))
        const resumed = createLevelRunner(deps)
        resumed.resume(runner.snapshot())
        expect(resumed.current()).toEqual(runner.current())
        resumed.onComplete((completion) => completions.push(completion))
        resumed.dispatch(correct('decision'))
        resumed.complete()
        resumed.advance()
        const view = resumed.current().view!
        expect(view.type).toBe('transfer')
        if (view.type === 'transfer') {
          seen.add(view.variantId)
          expect(OfferComparatorConfigSchema.parse(view.config).correctOfferId).toBe('fd')
        }
        resumed.dispatch(correct('transfer'))
        resumed.complete()
        expect(completions).toHaveLength(1)
        expect(completions[0]!.attempt.stars).toBe(mistake ? 2 : 3)
      }
    expect([...seen].sort()).toEqual(['books-next-term', 'course-fee'])
  })

  it('checks every consequence number against the TimeSlider config and finance output', () => {
    const lowRate = Math.max(0, lesson.annualRatePct! - lesson.rangeSpreadPct!)
    const highRate = lesson.annualRatePct! + lesson.rangeSpreadPct!
    const initial = rupees(lesson.initialAmountPaise / 100)
    const amounts = [
      initial,
      compound(initial, lowRate, 1, lesson.maxYears),
      compound(initial, highRate, 1, lesson.maxYears),
    ].map((amount) => amount / 100)
    for (const locale of [en, te]) {
      const text = locale.consequence.range
      expect(
        [...text.matchAll(/₹([\d,.]+)/g)].map((match) => Number(match[1]!.replaceAll(',', ''))),
      ).toEqual(amounts)
      expect([...text.matchAll(/(\d+)%/g)].map((match) => Number(match[1]))).toEqual([
        lowRate,
        highRate,
      ])
      const withoutAmountsOrRates = text.replace(/₹[\d,.]+|\d+%/g, '')
      expect(withoutAmountsOrRates.match(/\d+/g)?.map(Number)).toEqual([lesson.maxYears])
      expect(text).toContain('Assumption')
    }
  })

  it('contains no real-looking financial identities, phones or provider handles', () => {
    const text = JSON.stringify([level, en, te])
    expect(text).not.toMatch(/(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)/)
    expect(text).not.toMatch(/[\w.-]+@[a-z]{2,}/i)
    expect(text).not.toMatch(/\b\d{4}\s?\d{4}\s?\d{4}\b/)
    expect(text).not.toMatch(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/)
    expect(text).not.toMatch(/\b[A-Z]{4}0[A-Z0-9]{6}\b/)
  })
})

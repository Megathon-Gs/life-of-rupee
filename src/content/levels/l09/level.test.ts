import { describe, expect, it } from 'vitest'
import {
  FormFillerConfigSchema,
  OfferComparatorConfigSchema,
  P1_ERROR_CATEGORIES,
  type OfferComparatorConfig,
} from '@/core/contracts'
import { loanTotals } from '@/core/finance/emi'
import type { Paise } from '@/core/finance/money'
import { errorCategories, score } from '@/core/scoring'
import { i18n } from '@/i18n'
import { level } from './level'
import { sources } from './sources'
import en from '../../locales/en/l09.json'
import te from '../../locales/te/l09.json'

const rubric = level.steps[3].rubric
const decisionCorrect = { kind: 'choice' as const, stepId: 'decision', correct: true }
const transferCorrect = { kind: 'choice' as const, stepId: 'transfer', correct: true }

const lesson = OfferComparatorConfigSchema.parse(level.steps[1].config)
const decision = OfferComparatorConfigSchema.parse(level.steps[3].config)
const transferVariants = level.steps[5].variants
const kiran = OfferComparatorConfigSchema.parse(transferVariants[0]!.config)
const ravi = FormFillerConfigSchema.parse(transferVariants[1]!.config)

// Fictional scenario assumptions that are also written in the English text.
const LATE_CHARGE_RUPEES = 250
const MINA_SAVINGS_TARGET_RUPEES = 530_000
const MINA_HORIZON_MONTHS = 60
const RAVI = { freeRupees: 2_500, cushionRupees: 1_500, maxEmiRupees: 1_000 }

const rupees = (paise: number) => Math.round(paise / 100)
// Indian digit grouping, as used in the player-facing text (₹5,30,000).
const inr = (amount: number) => amount.toLocaleString('en-IN')
const amountsIn = (text: string) =>
  new Set([...text.matchAll(/₹([\d,]+)/g)].map((match) => Number(match[1]!.replaceAll(',', ''))))

type Offer = OfferComparatorConfig['offers'][number]
const figures = (offer: Offer) => {
  const totals = loanTotals(
    offer.principalPaise as Paise,
    offer.annualRatePct,
    offer.tenureMonths,
    offer.feesPaise as Paise,
  )
  return {
    emi: rupees(totals.emi),
    totalRepaid: rupees(totals.totalRepaid),
    interest: rupees(totals.totalInterest - offer.feesPaise),
    totalPaise: totals.totalRepaid,
    emiPaise: totals.emi,
  }
}
const offerById = (config: OfferComparatorConfig, id: string) =>
  config.offers.find((offer) => offer.id === id)!
const freeRupees = (config: OfferComparatorConfig) => {
  const { incomePaise, rentPaise, essentialsPaise } = config.budget!
  return rupees(incomePaise - rentPaise - essentialsPaise)
}
const horizonLeftover = (config: OfferComparatorConfig, offer: Offer) =>
  freeRupees(config) * MINA_HORIZON_MONTHS - figures(offer).totalRepaid

const textIn = (key: string) =>
  key
    .replace(/^l09:/, '')
    .split('.')
    .reduce<unknown>((value, part) => (value as Record<string, unknown>)[part], en) as string

describe('Level 9 steps', () => {
  it('uses the fixed six-step shape with only the hook gated on the Level 5 warning-sign flag', () => {
    expect(level.id).toBe('l09-loans-emi')
    expect(level.location).toBe('showroom')
    expect(level.skillNodes).toEqual(['borrowing.emi'])
    expect(level.worldEffects).toEqual([])
    expect(level.steps.map((step) => step.type)).toEqual([
      'hook',
      'lesson',
      'travel',
      'decision',
      'consequence',
      'transfer',
    ])
    expect(level.steps[0].when).toEqual({ flag: 'fraud.seenWarningSigns', equals: 'true' })
    for (const step of level.steps.slice(1)) expect(step.when).toBeUndefined()
    expect(level.steps[2].location).toBe('showroom')
  })

  it('keeps the hook to three lines where Dev is not the ad sender and says you can leave without borrowing', () => {
    const lines = level.steps[0].lineKeys.map(textIn)
    expect(lines).toHaveLength(3)
    expect(lines[0]).not.toMatch(/^Dev:/)
    expect(lines[0]).toMatch(/today only/i)
    expect(lines.slice(1).every((line) => line.startsWith('Dev:'))).toBe(true)
    expect(lines.join(' ')).toMatch(/leave without borrowing/)
    // The lesson must stand alone for profiles that skip the hook.
    expect(textIn(lesson.promptKey)).toMatch(/Mina/)
    expect(textIn(lesson.promptKey)).toMatch(/optional/)
  })

  it('parses every interaction config with its contract schema', () => {
    expect(level.steps[1].interaction).toBe('offerComparator')
    expect(level.steps[3].interaction).toBe('offerComparator')
    expect(transferVariants.map((variant) => variant.interaction)).toEqual([
      'offerComparator',
      'formFiller',
    ])
    expect(decision.offers.length).toBeGreaterThanOrEqual(3)
    expect(decision.budget).toBeDefined()
    expect(lesson.offers).toHaveLength(2)
  })
})

describe('Level 9 finance', () => {
  it('shows in the lesson that the longer tenure has a lower EMI but more interest and a higher total', () => {
    const [shortOffer, longOffer] = [
      offerById(lesson, 'twelve-months'),
      offerById(lesson, 'thirty-six-months'),
    ]
    expect(shortOffer.principalPaise).toBe(longOffer.principalPaise)
    expect(shortOffer.annualRatePct).toBe(longOffer.annualRatePct)
    expect(shortOffer.feesPaise).toBe(longOffer.feesPaise)
    expect(longOffer.tenureMonths).toBeGreaterThan(shortOffer.tenureMonths)
    expect(figures(longOffer).emiPaise).toBeLessThan(figures(shortOffer).emiPaise)
    expect(figures(longOffer).interest).toBeGreaterThan(figures(shortOffer).interest)
    expect(figures(longOffer).totalRepaid).toBeGreaterThan(figures(shortOffer).totalRepaid)
    expect(lesson.correctOfferId).toBe(shortOffer.id)
    expect(longOffer).toMatchObject({ error: 'loan.ignored_total_cost', severity: 'major' })
  })

  it('makes the long low-EMI decision offer cost more and the correct offer cheapest and affordable', () => {
    const low = offerById(decision, 'sixty-months')
    const correct = offerById(decision, decision.correctOfferId)
    const emis = decision.offers.map((offer) => figures(offer).emiPaise)
    expect(figures(low).emiPaise).toBe(Math.min(...emis))
    expect(low.tenureMonths).toBe(Math.max(...decision.offers.map((offer) => offer.tenureMonths)))
    expect(figures(low).totalRepaid).toBeGreaterThan(figures(correct).totalRepaid)
    expect(figures(low).interest).toBeGreaterThan(figures(correct).interest)
    expect(low).toMatchObject({ error: 'loan.ignored_total_cost', severity: 'major' })
    expect(Math.min(...decision.offers.map((offer) => figures(offer).totalPaise))).toBe(
      figures(correct).totalPaise,
    )
    expect(correct.error).toBeUndefined()
    // A manageable EMI: the correct offer is payable from what is left after rent and essentials.
    expect(figures(correct).emi).toBeLessThan(freeRupees(decision))
    // A third option is pulled in by a modest EMI but hides a larger fee.
    const highFee = offerById(decision, 'thirty-six-high-fee')
    expect(highFee.feesPaise).toBeGreaterThan(correct.feesPaise)
    expect(highFee).toMatchObject({ error: 'loan.emi_only' })
    expect(figures(highFee).totalRepaid).toBeGreaterThan(figures(correct).totalRepaid)
  })

  it('squeezes the budget: the low-EMI offer leaves less than the savings target over its longer period', () => {
    const low = offerById(decision, 'sixty-months')
    const correct = offerById(decision, decision.correctOfferId)
    expect(freeRupees(decision)).toBe(10_000)
    expect(low.tenureMonths).toBe(MINA_HORIZON_MONTHS)
    expect(horizonLeftover(decision, low)).toBeLessThan(MINA_SAVINGS_TARGET_RUPEES)
    expect(horizonLeftover(decision, correct)).toBeGreaterThanOrEqual(MINA_SAVINGS_TARGET_RUPEES)
    for (const offer of decision.offers) {
      if (offer.error)
        expect(horizonLeftover(decision, offer)).toBeLessThan(MINA_SAVINGS_TARGET_RUPEES)
    }
    // Honest framing: the low EMI is lighter each month, but it lasts far more months.
    expect(freeRupees(decision) - figures(low).emi).toBeGreaterThan(
      freeRupees(decision) - figures(correct).emi,
    )
    expect(low.tenureMonths).toBeGreaterThan(correct.tenureMonths)
    // The text states the same target and horizon.
    expect(textIn(decision.promptKey)).toContain(`₹${inr(MINA_SAVINGS_TARGET_RUPEES)}`)
    expect(textIn(decision.promptKey)).toContain('60 months')
    expect(textIn(decision.promptKey)).toContain(
      `₹${inr(freeRupees(decision) * MINA_HORIZON_MONTHS)}`,
    )
  })

  it('moves the correct answer and changes people and numbers in transfer variant A', () => {
    const correctIndex = (config: OfferComparatorConfig) =>
      config.offers.findIndex((offer) => offer.id === config.correctOfferId)
    expect(correctIndex(kiran)).not.toBe(correctIndex(decision))
    expect(kiran.offers.map((offer) => offer.principalPaise)).not.toEqual(
      decision.offers.map((offer) => offer.principalPaise),
    )
    expect(kiran.budget).not.toEqual(decision.budget)
    expect(textIn(decision.promptKey)).toContain('Mina')
    expect(textIn(kiran.promptKey)).toContain('Kiran')
    const free = freeRupees(kiran)
    const affordable = kiran.offers.filter((offer) => figures(offer).emi <= free)
    const cheapestAffordable = affordable.reduce((best, offer) =>
      figures(offer).totalPaise < figures(best).totalPaise ? offer : best,
    )
    expect(cheapestAffordable.id).toBe(kiran.correctOfferId)
    // The overall-cheapest offer is unaffordable, so a total-cost-only rule is also wrong here.
    const cheapest = kiran.offers.reduce((best, offer) =>
      figures(offer).totalPaise < figures(best).totalPaise ? offer : best,
    )
    expect(cheapest.id).not.toBe(kiran.correctOfferId)
    expect(figures(cheapest).emi).toBeGreaterThan(free)
    expect(cheapest).toMatchObject({ error: 'loan.missed_payment', severity: 'major' })
    const lowest = kiran.offers.reduce((best, offer) =>
      figures(offer).emiPaise < figures(best).emiPaise ? offer : best,
    )
    expect(lowest.tenureMonths).toBe(Math.max(...kiran.offers.map((offer) => offer.tenureMonths)))
    expect(lowest.error).toBe('loan.ignored_total_cost')
  })

  it('makes postponing the answer in transfer variant B because neither offer fits after essentials', () => {
    const [choice, total, missed] = ravi.fields
    expect(choice!.correctOptionId).toBe('postpone')
    expect(
      choice!.options.filter((option) => option.id !== 'postpone').length,
    ).toBeGreaterThanOrEqual(2)
    expect(total!.correctOptionId).toBe('lowerEmiCostsMore')
    expect(missed!.correctOptionId).toBe('dueWithCharge')
    expect(['loan.emi_only', 'loan.ignored_total_cost']).toContain(choice!.error)
    expect(total!.error).toBe('loan.ignored_total_cost')
    expect(missed!.error).toBe('loan.missed_payment')
    // Neither Ravi offer's EMI fits under his emergency-cushion ceiling.
    const principal = 4_800_000 as Paise
    const twentyFour = loanTotals(principal, 12, 24, 120_000 as Paise)
    const fortyEight = loanTotals(principal, 12, 48, 0 as Paise)
    expect(rupees(twentyFour.emi)).toBeGreaterThan(RAVI.maxEmiRupees)
    expect(rupees(fortyEight.emi)).toBeGreaterThan(RAVI.maxEmiRupees)
    expect(RAVI.freeRupees - RAVI.cushionRupees).toBe(RAVI.maxEmiRupees)
    expect(fortyEight.totalRepaid).toBeGreaterThan(twentyFour.totalRepaid)
    expect(amountsIn(textIn(ravi.titleKey))).toEqual(
      new Set([
        28_000,
        11_000,
        14_500,
        RAVI.freeRupees,
        RAVI.cushionRupees,
        RAVI.maxEmiRupees,
        48_000,
        rupees(twentyFour.emi),
        1_200,
        rupees(fortyEight.emi),
        LATE_CHARGE_RUPEES,
      ]),
    )
    expect(amountsIn(en.transfer.ravi.totalRight)).toEqual(
      new Set([rupees(fortyEight.totalRepaid), rupees(twentyFour.totalRepaid)]),
    )
  })

  it.each([
    ['en', en],
    ['te', te as unknown as typeof en],
  ])('quotes only recomputed rupee amounts in the %s text', (_lng, text) => {
    const l = (id: string) => figures(offerById(lesson, id))
    const d = (id: string) => figures(offerById(decision, id))
    const k = (id: string) => figures(offerById(kiran, id))
    const free = freeRupees(decision)
    const left = (id: string) => horizonLeftover(decision, offerById(decision, id))
    const principal = rupees(offerById(lesson, 'twelve-months').principalPaise)

    expect(amountsIn(text.lesson.explanation)).toEqual(
      new Set([
        l('twelve-months').emi,
        l('twelve-months').totalRepaid,
        l('twelve-months').interest,
        l('thirty-six-months').emi,
        l('thirty-six-months').totalRepaid,
        l('thirty-six-months').interest,
        principal,
        600,
      ]),
    )
    expect(amountsIn(text.decision.explanation)).toEqual(
      new Set([
        d('eighteen-months').emi,
        d('eighteen-months').totalRepaid,
        left('eighteen-months'),
        freeRupees(decision) * MINA_HORIZON_MONTHS,
        MINA_SAVINGS_TARGET_RUPEES,
        d('sixty-months').emi,
        d('sixty-months').totalRepaid,
        left('sixty-months'),
        d('thirty-six-high-fee').emi,
        3_000,
        d('thirty-six-high-fee').totalRepaid,
        left('thirty-six-high-fee'),
      ]),
    )
    expect(amountsIn(text.consequence.squeeze)).toEqual(
      new Set([
        d('sixty-months').emi,
        d('sixty-months').totalRepaid,
        left('sixty-months'),
        MINA_SAVINGS_TARGET_RUPEES,
      ]),
    )
    expect(amountsIn(text.consequence.ends)).toEqual(
      new Set([d('eighteen-months').totalRepaid, free, left('eighteen-months')]),
    )
    expect(amountsIn(text.consequence.explanation)).toEqual(
      new Set([
        free - d('sixty-months').emi,
        free - d('eighteen-months').emi,
        d('sixty-months').totalRepaid - d('eighteen-months').totalRepaid,
        d('eighteen-months').emi,
        free,
        d('sixty-months').totalRepaid,
        d('eighteen-months').totalRepaid,
        LATE_CHARGE_RUPEES,
      ]),
    )
    expect(amountsIn(text.transfer.kiran.explanation)).toEqual(
      new Set([
        k('twelve-months').emi,
        freeRupees(kiran),
        k('forty-eight-months').emi,
        k('forty-eight-months').totalRepaid,
        k('twenty-four-months').emi,
        k('twenty-four-months').totalRepaid,
        1_200,
      ]),
    )
  })

  it('labels and words the English consequence arithmetic', () => {
    const d = (id: string) => figures(offerById(decision, id))
    // Rounding is to the nearest rupee, written with Indian digit grouping.
    expect(en.decision.explanation).toContain(`₹${inr(d('eighteen-months').totalRepaid)}`)
    expect(en.consequence.explanation).toContain(
      `total cost of borrowing is about ₹${inr(d('sixty-months').totalRepaid - d('eighteen-months').totalRepaid)} more`,
    )
    // The consequence arithmetic about months matches the configured tenures.
    const extraMonths =
      offerById(decision, 'sixty-months').tenureMonths -
      offerById(decision, 'eighteen-months').tenureMonths
    expect(en.consequence.explanation).toContain(`${extraMonths} months longer`)
    expect(en.consequence.ends).toContain(
      `month ${offerById(decision, 'eighteen-months').tenureMonths + 1}`,
    )
  })

  it('writes each offer input and the late charge into its assumptions text', () => {
    for (const config of [lesson, decision, kiran]) {
      for (const offer of config.offers) {
        const text = textIn(offer.assumptionsKey)
        expect(text).toContain(`₹${inr(rupees(offer.principalPaise))}`)
        expect(text).toContain(`${offer.annualRatePct}%`)
        expect(text).toContain(`${offer.tenureMonths} months`)
        if (offer.feesPaise > 0) expect(text).toContain(`₹${inr(rupees(offer.feesPaise))}`)
        else expect(text).toContain('No fee')
        if (config !== lesson) expect(text).toContain(`₹${LATE_CHARGE_RUPEES}`)
      }
    }
    const incomeText = textIn(decision.promptKey)
    expect(incomeText).toContain(`₹${inr(rupees(decision.budget!.incomePaise))}`)
    expect(incomeText).toContain(`₹${inr(rupees(decision.budget!.rentPaise))}`)
    expect(incomeText).toContain(`₹${inr(rupees(decision.budget!.essentialsPaise))}`)
  })
})

describe('Level 9 scoring', () => {
  it('scores the documented corrected mistake path at 2 stars and a clean path at 3', () => {
    const wrong = offerById(decision, 'sixty-months')
    const mistake = {
      kind: 'choice' as const,
      stepId: 'decision',
      correct: false,
      error: wrong.error,
      severity: wrong.severity,
    }
    expect(mistake.error).toBe('loan.ignored_total_cost')
    const result = score([mistake, decisionCorrect, transferCorrect], rubric)
    expect(result.stars).toBe(2)
    expect(result.reviewItems).toMatchObject([
      { error: 'loan.ignored_total_cost', severity: 'major' },
    ])
    expect(score([decisionCorrect, transferCorrect], rubric).stars).toBe(3)
  })

  it('registers every error code used in the level configs with the scoring registry', () => {
    const codes = [
      ...[lesson, decision, kiran].flatMap((config) => config.offers.map((offer) => offer.error)),
      ...ravi.fields.map((field) => field.error),
    ].filter((code): code is string => Boolean(code))
    expect(codes.length).toBeGreaterThan(0)
    for (const code of codes) {
      expect(errorCategories[code], code).toBeDefined()
      expect(errorCategories[code]!.skillNode).toBe(level.skillNodes[0])
    }
  })

  it('scores every wrong option and localises its review card', () => {
    const wrongChoices = [
      ...[lesson, decision, kiran].flatMap((config) =>
        config.offers.filter((offer) => offer.error),
      ),
      ...ravi.fields.map((field) => ({ error: field.error, severity: undefined })),
    ]
    let scored = 0
    for (const choice of wrongChoices) {
      const definition = errorCategories[choice.error!]!
      scored += 1
      const result = score(
        [
          {
            kind: 'choice',
            stepId: 'decision',
            correct: false,
            error: choice.error,
            severity: choice.severity,
          },
          decisionCorrect,
          transferCorrect,
        ],
        rubric,
      )
      expect(result.reviewItems[0]!.reviewKey).toBe(definition.reviewKey)
      for (const lng of ['en', 'te']) {
        expect(
          i18n.exists(result.reviewItems[0]!.reviewKey, { lng, ns: 'l09', fallbackLng: false }),
        ).toBe(true)
      }
    }
    expect(scored).toBe(wrongChoices.length)
  })

  it('caps the attempt at 2 stars when the first transfer answer is wrong', () => {
    const wrong = offerById(kiran, 'forty-eight-months')
    const result = score(
      [
        decisionCorrect,
        {
          kind: 'choice',
          stepId: 'transfer',
          correct: false,
          error: wrong.error,
          severity: wrong.severity,
        },
        transferCorrect,
      ],
      rubric,
    )
    expect(result.stars).toBe(2)
    expect(result.capsApplied).toContain('transfer')
  })

  it('uses only contract error codes and gives each one English and Telugu review text in the review format', () => {
    const codes = new Set<string>()
    const collect = (error: string | undefined) => {
      if (error) codes.add(error)
    }
    for (const config of [lesson, decision, kiran])
      config.offers.forEach((offer) => collect(offer.error))
    ravi.fields.forEach((field) => collect(field.error))
    expect([...codes].sort()).toEqual([
      'loan.emi_only',
      'loan.ignored_total_cost',
      'loan.missed_payment',
    ])
    for (const code of codes) {
      expect(P1_ERROR_CATEGORIES as readonly string[]).toContain(code)
      for (const lng of ['en', 'te']) {
        expect(
          i18n.exists(`${code}.review`, { lng, ns: 'l09', fallbackLng: false }),
          `${lng} ${code}`,
        ).toBe(true)
      }
      const review = i18n.t(`${code}.review`, { lng: 'en', ns: 'l09' })
      for (const label of ['Your choice:', 'Safer choice:', 'Concept:', 'Why it matters:'])
        expect(review).toContain(label)
    }
    expect(en.loan.emi_only.review).not.toBe(en.loan.ignored_total_cost.review)
  })
})

describe('Level 9 content, claims and safety', () => {
  it('resolves every player-facing key in English and Telugu', () => {
    const check = (value: unknown, property = ''): void => {
      if (typeof value === 'string' && (property.endsWith('Key') || property.endsWith('Keys'))) {
        for (const lng of ['en', 'te'])
          expect(i18n.exists(value, { lng, fallbackLng: false }), value).toBe(true)
      } else if (Array.isArray(value)) {
        for (const item of value) check(item, property)
      } else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) check(item, key)
      }
    }
    check(level)
  })

  it('marks the Telugu translation as reviewed and the English text as educator-approved', () => {
    expect(te._meta.translationStatus).toMatch(/ఆమోదించబడింది/)
    expect(en._meta.translationStatus).toMatch(/approved by NGO educator/)
    expect(en.translationStatus).toMatch(/approved by NGO educator/)
  })

  it('backs every claim with a registered source, resolvable text and an educator review stamp', () => {
    const sourceIds = new Set(sources.map((source) => source.id as string))
    expect(level.claims.length).toBeGreaterThan(0)
    for (const claim of level.claims) {
      expect(claim.sourceIds.length).toBeGreaterThan(0)
      for (const id of claim.sourceIds) expect(sourceIds.has(id), id).toBe(true)
      for (const lng of ['en', 'te'])
        expect(
          i18n.exists(claim.textKey, { lng, ns: 'l09', fallbackLng: false }),
          claim.textKey,
        ).toBe(true)
      expect(claim.reviewerRole).toBe('NGO educator (user approval)')
      expect(claim.reviewedOn).toBe('2026-10-10')
    }
    for (const source of sources) {
      expect(source.url).toMatch(/^https:\/\/www\.rbi\.org\.in\//)
      expect(source.retrievedOn).toBe('2026-10-10')
    }
    // Statements that carry regulatory facts are claim-backed.
    const claimed = new Set(level.claims.map((claim) => claim.textKey))
    for (const key of [
      'l09:hook.2',
      'l09:consequence.explanation',
      'l09:lesson.explanation',
      'l09:loan.missed_payment.review',
      'l09:loan.emi_only.review',
    ]) {
      expect(claimed.has(key), key).toBe(true)
    }
  })

  it('does not teach that all loans are bad or recommend products', () => {
    const text = JSON.stringify(en)
    expect(en.consequence.explanation).toMatch(/Borrowing can help/)
    expect(en.consequence.explanation).toMatch(/postponing and saving first can be safer/)
    expect(text).not.toMatch(/all loans are bad|never borrow/i)
    expect(text).not.toMatch(/\b(?:recommend|best loan|guaranteed)\b/i)
  })

  it('contains no real-looking phone, UPI, Aadhaar, PAN or IFSC strings', () => {
    const serialized = JSON.stringify([level, sources, en, te])
    expect(serialized).not.toMatch(/\b\d{12}\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/)
    expect(serialized).not.toMatch(/\b[A-Z]{4}0[A-Z0-9]{6}\b/)
    expect(serialized).not.toMatch(/\b[6-9]\d{9}\b/)
    expect(serialized).not.toMatch(/@(ok(axis|hdfcbank|icici|sbi)|ybl|paytm|apl|ibl|axl|upi)\b/i)
  })
})

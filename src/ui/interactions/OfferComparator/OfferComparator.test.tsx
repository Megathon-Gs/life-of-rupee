import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { OfferComparatorConfig } from '@/core/contracts'
import { loanTotals } from '@/core/finance/emi'
import { formatINR, rupees, type Paise } from '@/core/finance/money'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { OfferComparator } from './OfferComparator'

// Acceptance fixture: A is ₹1,00,000 at 12% for 12 months, B the same at 36 months.
const config: OfferComparatorConfig = {
  titleKey: 'l09:lesson.title',
  promptKey: 'l09:lesson.prompt',
  hintKeys: ['l09:lesson.hint1', 'l09:lesson.hint2'],
  explanationKey: 'l09:lesson.explanation',
  offers: [
    {
      id: 'a',
      labelKey: 'l09:lesson.twelveLabel',
      principalPaise: rupees(100000),
      annualRatePct: 12,
      tenureMonths: 12,
      feesPaise: 0,
      assumptionsKey: 'l09:lesson.twelveAssumptions',
    },
    {
      id: 'b',
      labelKey: 'l09:lesson.thirtySixLabel',
      principalPaise: rupees(100000),
      annualRatePct: 12,
      tenureMonths: 36,
      feesPaise: 0,
      assumptionsKey: 'l09:lesson.thirtySixAssumptions',
      error: 'loan.ignored_total_cost',
      severity: 'major',
    },
  ],
  correctOfferId: 'a',
  budget: { incomePaise: rupees(42000), rentPaise: rupees(15000), essentialsPaise: rupees(17000) },
}

const totalsOf = (offer: OfferComparatorConfig['offers'][number]) =>
  loanTotals(
    offer.principalPaise as Paise,
    offer.annualRatePct,
    offer.tenureMonths,
    offer.feesPaise as Paise,
  )

const panel = (props: React.ComponentProps<typeof OfferComparator>) => (
  <PanelShell open onOpenChange={vi.fn()} title="Offers">
    <OfferComparator {...props} />
  </PanelShell>
)

const card = (id: string) => within(screen.getByTestId(`offer-${id}`))

describe('OfferComparator', () => {
  it('derives every displayed figure from finance and labels each rate as an assumption', async () => {
    const { container } = renderUi(
      panel({ config, locale: 'en', onEvent: vi.fn(), onComplete: vi.fn(), stepId: 'decision' }),
    )

    for (const offer of config.offers) {
      const total = totalsOf(offer)
      expect(card(offer.id).getByText(formatINR(total.emi, 'en'))).toBeTruthy()
      expect(card(offer.id).getByText(formatINR(total.totalRepaid, 'en'))).toBeTruthy()
      expect(card(offer.id).getByText(formatINR(total.totalInterest, 'en'))).toBeTruthy()
    }
    // Acceptance numbers: A's EMI is ₹8,884.88 and B's total interest beats A's.
    expect(card('a').getByText('₹8,884.88')).toBeTruthy()
    expect(totalsOf(config.offers[1]!).totalInterest).toBeGreaterThan(
      totalsOf(config.offers[0]!).totalInterest,
    )
    expect(
      card('b').getByText(formatINR(totalsOf(config.offers[1]!).totalInterest, 'en')),
    ).toBeTruthy()

    // Every rate is labelled as an assumption.
    expect(card('a').getByText('Assumption: 12% a year')).toBeTruthy()
    expect(card('b').getByText('Assumption: 12% a year')).toBeTruthy()
    expect(screen.getByText('Simulated — never enter real details')).toBeTruthy()
    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  }, 20_000)

  it('reports the higher-total-cost mistake, two hints, explanation, then completes once', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    renderUi(panel({ config, locale: 'en', onEvent, onComplete, stepId: 'decision' }))

    const chooseB = screen.getByRole('button', { name: 'Choose: Offer 2: 36 months' })
    chooseB.focus()
    await user.keyboard('{Enter}')
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'loan.ignored_total_cost',
      severity: 'major',
    })
    await user.click(screen.getByRole('button', { name: 'Why is this incorrect?' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'explanationOpened', stepId: 'decision' })

    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    expect(onEvent.mock.calls.slice(-2).map(([event]) => event)).toEqual([
      { kind: 'hint', stepId: 'decision', level: 1 },
      { kind: 'hint', stepId: 'decision', level: 2 },
    ])

    await user.click(screen.getByRole('button', { name: 'Choose: Offer 1: 12 months' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'decision', correct: true })
    await user.click(screen.getByRole('button', { name: 'Choose: Offer 1: 12 months' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('reports the EMI-only mistake when the low-EMI offer overruns the budget', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const emiOnly: OfferComparatorConfig = {
      ...config,
      budget: {
        incomePaise: rupees(18000),
        rentPaise: rupees(8000),
        essentialsPaise: rupees(7000),
      },
      offers: config.offers.map((offer) =>
        offer.id === 'b' ? { ...offer, error: 'loan.emi_only' } : offer,
      ),
    }
    const free = rupees(18000) - rupees(8000) - rupees(7000)
    expect(totalsOf(emiOnly.offers[1]!).emi).toBeLessThan(totalsOf(emiOnly.offers[0]!).emi)
    expect(totalsOf(emiOnly.offers[1]!).emi).toBeGreaterThan(free)

    renderUi(
      panel({ config: emiOnly, locale: 'en', onEvent, onComplete: vi.fn(), stepId: 'decision' }),
    )
    await user.click(screen.getByRole('button', { name: 'Choose: Offer 2: 36 months' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'loan.emi_only',
      severity: 'major',
    })
  })

  it('shows the schedule bar and budget overlay for the selected offer', async () => {
    const user = userEvent.setup()
    const { container } = renderUi(
      panel({ config, locale: 'en', onEvent: vi.fn(), onComplete: vi.fn(), stepId: 'decision' }),
    )

    const schedule = () => screen.getByRole('table')
    expect(within(schedule()).getAllByRole('row')).toHaveLength(13) // header + 12 months
    expect(within(schedule()).getAllByRole('rowheader')).toHaveLength(12)
    expect(container.querySelectorAll('[class*="barPrincipal"]').length).toBeGreaterThan(0)

    // Budget overlay: ₹10,000 left before the loan, minus A's EMI leaves ₹1,115.12.
    const free = rupees(42000) - rupees(15000) - rupees(17000)
    expect(
      screen.getByText(formatINR((free - totalsOf(config.offers[0]!).emi) as Paise, 'en')),
    ).toBeTruthy()
    expect(await axeViolations(container)).toEqual([])

    await user.click(
      screen.getByRole('button', { name: 'View monthly breakdown: Offer 2: 36 months' }),
    )
    expect(within(schedule()).getAllByRole('row')).toHaveLength(37) // header + 36 months
    expect(
      screen.getByText(formatINR((free - totalsOf(config.offers[1]!).emi) as Paise, 'en')),
    ).toBeTruthy()
  }, 20_000)
})

import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { OfferComparatorConfigSchema, TimeSliderConfigSchema } from '@/core/contracts'
import { compound } from '@/core/finance/interest'
import { formatINR, rupees } from '@/core/finance/money'
import { i18n } from '@/i18n'
import { OfferComparator } from '@/ui/interactions/OfferComparator/OfferComparator'
import { TimeSlider } from '@/ui/interactions/TimeSlider/TimeSlider'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { level } from './level'

it.each(['en', 'te'] as const)(
  'renders all four investment cards and the scripted choice in %s',
  async (locale) => {
    const user = userEvent.setup()
    const config = OfferComparatorConfigSchema.parse(level.steps[3].config)
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    const { container } = renderUi(
      <PanelShell open onOpenChange={vi.fn()} title="Investments">
        <OfferComparator
          config={config}
          locale={locale}
          onEvent={onEvent}
          onComplete={onComplete}
          stepId="decision"
        />
      </PanelShell>,
      { locale },
    )
    for (const instrument of config.investmentInstruments!) {
      const card = within(screen.getByTestId(`offer-${instrument.id}`))
      expect(card.getByText(i18n.t(instrument.riskKey, { lng: locale }))).toBeTruthy()
      expect(card.getByText(i18n.t(instrument.liquidityKey, { lng: locale }))).toBeTruthy()
      expect(card.getByText(i18n.t(instrument.timeHorizonKey, { lng: locale }))).toBeTruthy()
    }
    expect(screen.queryByRole('table')).toBeNull()
    expect(
      container.querySelector('input[type="text"],textarea,[contenteditable="true"]'),
    ).toBeNull()
    const choose = (id: string) => within(screen.getByTestId(`offer-${id}`)).getByRole('button')
    choose('equities').focus()
    await user.keyboard('{Enter}')
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'investing.concentrated_risk',
      severity: 'major',
    })
    choose('mutualFunds').focus()
    await user.keyboard('{Enter}')
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(await axeViolations(container)).toEqual([])
  },
  20_000,
)

it('shows the finance-derived illustrative range with no guaranteed-loss floor', async () => {
  const user = userEvent.setup()
  const config = TimeSliderConfigSchema.parse(level.steps[1].config)
  const onEvent = vi.fn()
  const onComplete = vi.fn()
  renderUi(
    <TimeSlider
      config={config}
      locale="en"
      onEvent={onEvent}
      onComplete={onComplete}
      stepId="lesson"
    />,
    { reducedMotion: true },
  )
  const forward = screen.getByRole('button', { name: 'Forward one year' })
  forward.focus()
  for (let year = 0; year < config.maxYears; year++) await user.keyboard('{Enter}')
  const initial = rupees(config.initialAmountPaise / 100)
  const low = formatINR(
    compound(initial, config.annualRatePct! - config.rangeSpreadPct!, 1, config.maxYears),
    'en',
  )
  const high = formatINR(
    compound(initial, config.annualRatePct! + config.rangeSpreadPct!, 1, config.maxYears),
    'en',
  )
  expect(
    screen.getByText(
      `After ${config.maxYears} years, the illustrative range is ${low} to ${high}.`,
    ),
  ).toBeTruthy()
  expect(screen.getByText(/real investments can lose money and fall outside it/)).toBeTruthy()
  expect(screen.getByText('Assumption: 6% a year')).toBeTruthy()
  await user.click(
    screen.getByRole('button', { name: i18n.t('l11:lesson.promise', { lng: 'en' }) }),
  )
  expect(onEvent).toHaveBeenLastCalledWith({
    kind: 'choice',
    stepId: 'lesson',
    correct: false,
    error: 'investing.guaranteed_return',
    severity: 'major',
  })
  await user.click(
    screen.getByRole('button', { name: i18n.t('l11:lesson.assumption', { lng: 'en' }) }),
  )
  expect(onComplete).toHaveBeenCalledTimes(1)
})

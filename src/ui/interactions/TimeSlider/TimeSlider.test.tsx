import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TimeSliderConfig } from '@/core/contracts'
import { compound } from '@/core/finance/interest'
import { formatINR, rupees, type Paise } from '@/core/finance/money'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { TimeSlider } from './TimeSlider'

const text = {
  titleKey: 'timeSlider:fixture.title',
  promptKey: 'timeSlider:fixture.prompt',
  hintKeys: ['timeSlider:fixture.hint1', 'timeSlider:fixture.hint2'] as [string, string],
  explanationKey: 'timeSlider:fixture.explanation',
}
const inflation: TimeSliderConfig = {
  ...text,
  initialAmountPaise: rupees(1000),
  annualInflationPct: 6,
  maxYears: 5,
  error: 'inflation.nominal_vs_real',
}
const savings: TimeSliderConfig = {
  ...text,
  initialAmountPaise: rupees(10000),
  annualRatePct: 7,
  maxYears: 3,
  error: 'saving.ignored_liquidity',
}
const range: TimeSliderConfig = {
  ...savings,
  annualInflationPct: 5,
  maxYears: 10,
  error: 'saving.ignored_liquidity',
}

const panel = (props: React.ComponentProps<typeof TimeSlider>) => (
  <PanelShell open onOpenChange={vi.fn()} title="Time">
    <TimeSlider {...props} />
  </PanelShell>
)
const base = { locale: 'en' as const, stepId: 'decision' }

describe('TimeSlider', () => {
  it('moves year by year with slider and buttons, labelling every assumption', async () => {
    const user = userEvent.setup()
    const { container } = renderUi(
      panel({ ...base, config: savings, onEvent: vi.fn(), onComplete: vi.fn() }),
    )
    expect(screen.getByText('Assumption: 7% a year')).toBeTruthy()
    expect(screen.getByText('Simulated — never enter real details')).toBeTruthy()
    const back = screen.getByRole('button', { name: 'Back one year' })
    const forward = screen.getByRole('button', { name: 'Forward one year' })
    expect((back as HTMLButtonElement).disabled).toBe(true)

    await user.click(forward)
    await user.click(forward)
    const grown = formatINR(compound(rupees(10000), 7, 1, 2), 'en')
    expect(screen.getByRole('status', { name: '' }).textContent).toContain(grown)

    const slider = screen.getByRole('slider')
    // Native range inputs step with the arrow keys in browsers; jsdom only fires the change.
    fireEvent.change(slider, { target: { value: '3' } })
    expect((slider as HTMLInputElement).value).toBe('3')
    expect((forward as HTMLButtonElement).disabled).toBe(true)

    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  }, 20_000)

  it('reports nominal-vs-real mistake, two hints, explanation, then completes once', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    renderUi(panel({ ...base, config: inflation, onEvent, onComplete }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } })
    expect(screen.getByText('Assumption: prices rise 6% a year')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'The bigger rupee number is worth more' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'inflation.nominal_vs_real',
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

    const right = screen.getByRole('button', { name: 'What the money can buy matters most' })
    await user.click(right)
    await user.click(right)
    expect(onEvent).toHaveBeenCalledWith({ kind: 'choice', stepId: 'decision', correct: true })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('uses configured choices: the locked deposit reports its own category, the other completes', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    const config: TimeSliderConfig = {
      ...savings,
      choices: [
        {
          id: 'locked',
          labelKey: 'timeSlider:fixture.locked',
          error: 'saving.ignored_liquidity',
          severity: 'major',
        },
        { id: 'flexible', labelKey: 'timeSlider:fixture.flexible' },
      ],
      correctChoiceId: 'flexible',
    }
    renderUi(panel({ ...base, config, onEvent, onComplete }))
    await user.click(screen.getByRole('button', { name: 'fixture.locked' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'saving.ignored_liquidity',
      severity: 'major',
    })
    expect(onComplete).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'fixture.flexible' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'decision', correct: true })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('falls back to the config error for the derived wrong answer', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    renderUi(panel({ ...base, config: savings, onEvent, onComplete: vi.fn() }))
    await user.click(screen.getByRole('button', { name: 'The amount stays the same' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'saving.ignored_liquidity',
      severity: 'major',
    })
  })

  it('uses the configured range spread in the label and the range', () => {
    renderUi(
      panel({
        ...base,
        config: { ...range, rangeSpreadPct: 1 },
        onEvent: vi.fn(),
        onComplete: vi.fn(),
      }),
    )
    fireEvent.change(screen.getByRole('slider'), { target: { value: '10' } })
    expect(screen.getByText(/1 percentage points/)).toBeTruthy()
    const low = formatINR(compound(rupees(10000), 6, 1, 10) as Paise, 'en')
    expect(screen.getByRole('status').textContent).toContain(low)
  })

  it('shows Level 11 outcomes as a range, never one promised number', () => {
    renderUi(panel({ ...base, config: range, onEvent: vi.fn(), onComplete: vi.fn() }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '10' } })
    const low = formatINR(compound(rupees(10000), 5, 1, 10) as Paise, 'en')
    const high = formatINR(compound(rupees(10000), 9, 1, 10) as Paise, 'en')
    expect(screen.getByRole('status').textContent).toContain(`${low} to ${high}`)
    expect(screen.getByText(/a range, not a promise/)).toBeTruthy()
    // Low case grows 5% a year against 5% inflation: exactly today's ₹10,000.
    const realLow = formatINR(rupees(10000), 'en')
    expect(screen.getByText(/In today's money/).textContent).toContain(realLow)
  })

  it('shows what cash buys in the basket mode and passes axe in every mode', async () => {
    for (const config of [inflation, range]) {
      const { container, unmount } = renderUi(
        panel({ ...base, config, onEvent: vi.fn(), onComplete: vi.fn() }),
      )
      fireEvent.change(screen.getByRole('slider'), { target: { value: String(config.maxYears) } })
      if (config === inflation) expect(screen.getByText(/as cash/)).toBeTruthy()
      expect(await axeViolations(container)).toEqual([])
      unmount()
    }
  }, 30_000)

  it('updates the chart without animation under reduced motion', () => {
    const props = { ...base, config: savings, onEvent: vi.fn(), onComplete: vi.fn() }
    const { unmount } = renderUi(panel(props), { reducedMotion: true })
    expect(screen.getByTestId('time-chart').getAttribute('data-motion')).toBe('reduced')
    fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } })
    expect(screen.getByTestId('time-chart').getAttribute('data-motion')).toBe('reduced')
    unmount()
    renderUi(panel(props), { reducedMotion: false })
    expect(screen.getByTestId('time-chart').getAttribute('data-motion')).toBe('full')
  })
})

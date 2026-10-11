import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { BudgetAllocatorConfig } from '@/core/contracts'
import { rupees } from '@/core/finance/money'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { BudgetAllocator } from './BudgetAllocator'
import {
  JARS,
  STEP_PAISE,
  addToJar,
  initialAllocation,
  remaining,
  removeFromJar,
  type Allocation,
} from './allocation'

const config: BudgetAllocatorConfig = {
  titleKey: 'budgetAllocator:sample.title',
  promptKey: 'budgetAllocator:sample.prompt',
  hintKeys: ['budgetAllocator:sample.hint1', 'budgetAllocator:sample.hint2'],
  explanationKey: 'budgetAllocator:sample.explanation',
  availablePaise: rupees(5000),
  essentialsPaise: rupees(2000),
  recurringCommitmentPaise: rupees(1000),
  errors: { noEssentials: 'budget.no_essentials', noSavings: 'budget.no_savings' },
}

const mount = (onEvent = vi.fn(), onComplete = vi.fn(), c = config) =>
  renderUi(
    <PanelShell open onOpenChange={vi.fn()} title="Budget">
      <BudgetAllocator
        config={c}
        locale="en"
        onEvent={onEvent}
        onComplete={onComplete}
        stepId="plan"
      />
    </PanelShell>,
  )

const add = async (user: ReturnType<typeof userEvent.setup>, jar: string, times: number) => {
  for (let i = 0; i < times; i += 1) {
    await user.click(screen.getByRole('button', { name: `Add money to ${jar}` }))
  }
}

describe('BudgetAllocator', () => {
  it('pre-fills the commitment, which cannot be removed, and has no text inputs', async () => {
    const { container } = mount()
    expect(screen.getByTestId('amount-needs').textContent).toBe('₹1,000.00')
    expect(
      (screen.getByRole('button', { name: 'Take money out of Needs' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(screen.getByText('Simulated — never enter real details')).toBeTruthy()
    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  }, 20_000)

  it('reports no_essentials (major) when all money goes to wants', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    mount(onEvent, vi.fn(), { ...config, recurringCommitmentPaise: undefined })
    await add(user, 'Wants', 10)
    expect(screen.getByTestId('remaining').textContent).toBe('₹0.00')
    await user.click(screen.getByRole('button', { name: 'Check my plan' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'plan',
      correct: false,
      error: 'budget.no_essentials',
      severity: 'major',
    })
    await user.click(screen.getByRole('button', { name: 'Why is this incorrect?' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'explanationOpened', stepId: 'plan' })
  }, 20_000)

  it('reports no_savings (minor) when essentials are met but savings are 0', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    mount(onEvent)
    await add(user, 'Needs', 8)
    await user.click(screen.getByRole('button', { name: 'Check my plan' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'plan',
      correct: false,
      error: 'budget.no_savings',
      severity: 'minor',
    })
  }, 20_000)

  it('completes once on a valid plan, with two hint levels', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    mount(onEvent, onComplete)
    await add(user, 'Needs', 4)
    await add(user, 'Wants', 2)
    await add(user, 'Savings', 4)
    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    expect(onEvent.mock.calls.map(([e]) => e)).toEqual([
      { kind: 'hint', stepId: 'plan', level: 1 },
      { kind: 'hint', stepId: 'plan', level: 2 },
    ])
    await user.click(screen.getByRole('button', { name: 'Check my plan' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'plan', correct: true })
    await user.click(screen.getByRole('button', { name: 'Check my plan' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  }, 20_000)

  it('moves a step into a jar on drop', () => {
    mount()
    const data = { getData: () => 'money', setData: vi.fn() }
    fireEvent.drop(screen.getByTestId('jar-savings'), { dataTransfer: data })
    expect(screen.getByTestId('amount-savings').textContent).toBe('₹500.00')
  }, 20_000)

  it('never exceeds the available amount or goes negative (property)', () => {
    let seed = 7
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32
    for (let run = 0; run < 100; run += 1) {
      const available = Math.floor(rand() * 400_000)
      const commitment = Math.floor(rand() * available)
      let a: Allocation = initialAllocation(available, commitment)
      for (let i = 0; i < 100; i += 1) {
        const jar = JARS[Math.floor(rand() * 3)]!
        const step = 1 + Math.floor(rand() * STEP_PAISE * 2)
        a =
          rand() < 0.6 ? addToJar(available, a, jar, step) : removeFromJar(a, jar, commitment, step)
        expect(a.needs + a.wants + a.savings).toBeLessThanOrEqual(available)
        expect(remaining(available, a)).toBeGreaterThanOrEqual(0)
        expect(Math.min(a.wants, a.savings)).toBeGreaterThanOrEqual(0)
        expect(a.needs).toBeGreaterThanOrEqual(Math.min(commitment, available))
      }
    }
  }, 20_000)
})

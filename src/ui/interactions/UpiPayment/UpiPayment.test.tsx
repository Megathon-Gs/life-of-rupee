import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { UpiPaymentConfig } from '@/core/contracts'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { UpiPayment } from './UpiPayment'

const config: UpiPaymentConfig = {
  titleKey: 'UPI payment',
  promptKey: 'Check the fictional payment details.',
  hintKeys: ['Hint one', 'Hint two'],
  explanationKey: 'A PIN authorizes a payment; it is not needed to receive money.',
  mode: 'receive',
  payeeNameKey: 'Asha Example',
  payeeHandleKey: 'asha@example',
  amountPaise: 50000,
  noteKey: 'Market items',
  choices: [
    { id: 'decline', labelKey: 'Decline request', action: 'decline' },
    {
      id: 'pin',
      labelKey: 'Enter PIN',
      action: 'enterPin',
      error: 'upi.pin_to_receive',
      severity: 'critical',
    },
  ],
  correctChoiceId: 'decline',
}
const panel = (props: React.ComponentProps<typeof UpiPayment>) => (
  <PanelShell open onOpenChange={vi.fn()} title="Payment">
    <UpiPayment {...props} />
  </PanelShell>
)

describe('UpiPayment', () => {
  it('emits a critical PIN-to-receive error without retaining PIN digits', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    const { container } = renderUi(
      panel({ config, locale: 'en', onEvent, onComplete, stepId: 'decision' }),
    )

    await user.click(screen.getByRole('button', { name: 'Enter PIN' }))
    for (const digit of [1, 2, 3, 4]) {
      await user.click(screen.getByRole('button', { name: `Enter mock digit ${digit}` }))
    }
    await user.click(screen.getByRole('button', { name: 'Confirm mock PIN' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'upi.pin_to_receive',
      severity: 'critical',
    })
    expect(onEvent.mock.calls.flat().join(' ')).not.toContain('1234')
    expect(screen.queryByText(/Mock PIN:/)).toBeNull()
    expect(onComplete).not.toHaveBeenCalled()
    expect(await axeViolations(container)).toEqual([])
  })

  it('completes a safe decline, emits hints, and keeps controls keyboard-operable', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    const { container } = renderUi(
      panel({ config, locale: 'en', onEvent, onComplete, stepId: 'decision' }),
    )

    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    expect(onEvent.mock.calls.slice(-2).map(([event]) => event)).toEqual([
      { kind: 'hint', stepId: 'decision', level: 1 },
      { kind: 'hint', stepId: 'decision', level: 2 },
    ])
    const decline = screen.getByRole('button', { name: 'Decline request' })
    decline.focus()
    await user.keyboard('{Enter}')
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'decision', correct: true })
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Simulated — never enter real details')).toBeTruthy()
    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it('reports approval of a mismatched payee with its configured error', async () => {
    const wrongPayeeConfig: UpiPaymentConfig = {
      ...config,
      mode: 'pay',
      correctChoiceId: 'decline',
      choices: [
        { id: 'decline', labelKey: 'Decline', action: 'decline' },
        {
          id: 'approve',
          labelKey: 'Approve payment',
          action: 'enterPin',
          error: 'upi.wrong_payee',
          severity: 'major',
        },
      ],
    }
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    renderUi(
      panel({ config: wrongPayeeConfig, locale: 'en', onEvent, onComplete, stepId: 'decision' }),
    )

    await user.click(screen.getByRole('button', { name: 'Approve payment' }))
    for (const digit of [1, 2, 3, 4]) {
      await user.click(screen.getByRole('button', { name: `Enter mock digit ${digit}` }))
    }
    await user.click(screen.getByRole('button', { name: 'Confirm mock PIN' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'upi.wrong_payee',
      severity: 'major',
    })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('completes approval when the configured payee and amount are correct', async () => {
    const payConfig: UpiPaymentConfig = {
      ...config,
      mode: 'pay',
      choices: [
        {
          id: 'approve',
          labelKey: 'Approve payment',
          action: 'enterPin',
        },
        {
          id: 'decline',
          labelKey: 'Decline',
          action: 'decline',
          error: 'upi.wrong_payee',
          severity: 'major',
        },
      ],
      correctChoiceId: 'approve',
    }
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    renderUi(panel({ config: payConfig, locale: 'en', onEvent, onComplete, stepId: 'decision' }))

    expect(screen.getByText('Asha Example')).toBeTruthy()
    expect(screen.getByText('₹500.00')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Approve payment' }))
    for (const digit of [1, 2, 3, 4]) {
      await user.click(screen.getByRole('button', { name: `Enter mock digit ${digit}` }))
    }
    await user.click(screen.getByRole('button', { name: 'Confirm mock PIN' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'decision', correct: true })
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/Mock PIN:/)).toBeNull()
  })
})

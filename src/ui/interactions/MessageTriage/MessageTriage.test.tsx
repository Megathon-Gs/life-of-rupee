import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MessageTriageConfig } from '@/core/contracts'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { MessageTriage } from './MessageTriage'

const config: MessageTriageConfig = {
  titleKey: 'l05:decision.title',
  promptKey: 'l05:decision.prompt',
  hintKeys: ['l05:decision.hint1', 'l05:decision.hint2'],
  explanationKey: 'l05:decision.explanation',
  messages: [
    {
      id: 'otp',
      channel: 'sms',
      senderKey: 'l05:decision.otp.sender',
      bodyKey: 'l05:decision.otp.body',
      correctClassification: 'fraud',
      warningSigns: [
        { id: 'urgency', labelKey: 'l05:sign.urgency' },
        { id: 'otp-pin-request', labelKey: 'l05:sign.otpPin' },
      ],
      requiredWarningSignIds: ['urgency', 'otp-pin-request'],
      error: 'fraud.shared_otp',
      severity: 'critical',
    },
    {
      id: 'routine',
      channel: 'chat',
      senderKey: 'l05:decision.safe.sender',
      bodyKey: 'l05:decision.safe.body',
      correctClassification: 'safe',
      warningSigns: [],
      requiredWarningSignIds: [],
      error: 'fraud.misclassified',
      severity: 'minor',
    },
  ],
}
const panel = (props: React.ComponentProps<typeof MessageTriage>) => (
  <PanelShell open onOpenChange={vi.fn()} title="Message triage">
    <MessageTriage {...props} />
  </PanelShell>
)

describe('MessageTriage', () => {
  it('emits configured errors and critical severity for an OTP message marked safe', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const { container } = renderUi(
      panel({ config, locale: 'en', onEvent, onComplete: vi.fn(), stepId: 'decision' }),
    )
    await user.click(screen.getByRole('button', { name: 'Mark safe' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'fraud.shared_otp',
      severity: 'critical',
    })
    expect(screen.getAllByText('OTP or PIN request: asks for a secret code')).toHaveLength(2)
    expect(await axeViolations(container)).toEqual([])
    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
  }, 15000)

  it('keeps configured order and completes only when each message and required signs are correct', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    renderUi(panel({ config, locale: 'en', onEvent, onComplete, stepId: 'decision' }))
    expect(screen.getByText('Account Care Desk (demo)')).toBeTruthy()
    await user.click(screen.getByLabelText('Urgency: pushes you to act right now'))
    await user.click(screen.getByLabelText('OTP or PIN request: asks for a secret code'))
    await user.click(screen.getByRole('button', { name: 'Mark fraud' }))
    expect(screen.getByText("Ravi's Phone Shop (demo)")).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Mark safe' }))
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { kind: 'choice', stepId: 'decision', correct: true },
      { kind: 'choice', stepId: 'decision', correct: true },
    ])
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

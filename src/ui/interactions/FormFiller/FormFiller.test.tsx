import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { FormFillerConfig } from '@/core/contracts'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { FormFiller } from './FormFiller'

const config: FormFillerConfig = {
  titleKey: 'l02:decision.title',
  fields: [
    {
      id: 'accountRoute',
      labelKey: 'l02:decision.routeLabel',
      options: [
        { id: 'adult', labelKey: 'l02:decision.adult' },
        { id: 'minor', labelKey: 'l02:decision.minor' },
      ],
      correctOptionId: 'minor',
      error: 'bank.wrong_document',
    },
    {
      id: 'identity',
      labelKey: 'l02:decision.identityLabel',
      options: [
        { id: 'passport', labelKey: 'l02:decision.passport' },
        { id: 'aadhaarOnly', labelKey: 'l02:decision.aadhaarOnly' },
      ],
      correctOptionId: 'passport',
      error: 'kyc.wrong_document',
    },
  ],
}
const panel = (props: React.ComponentProps<typeof FormFiller>) => (
  <PanelShell open onOpenChange={vi.fn()} title="Form">
    <FormFiller {...props} />
  </PanelShell>
)

describe('FormFiller', () => {
  it('emits configured wrong answers, two hints, then completes once using keyboard picks', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    const { container } = renderUi(
      panel({ config, locale: 'en', onEvent, onComplete, stepId: 'decision' }),
    )

    const adult = screen.getByRole('button', { name: 'Adult account, no guardian details' })
    adult.focus()
    await user.keyboard('{Enter}')
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'decision',
      correct: false,
      error: 'bank.wrong_document',
    })
    expect(
      screen.getByText('That choice does not fit this fictional task. You can try again.'),
    ).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Why is this incorrect?' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'explanationOpened', stepId: 'decision' })
    expect(screen.getByText(/choose the option that fits/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    expect(onEvent.mock.calls.slice(-2).map(([event]) => event)).toEqual([
      { kind: 'hint', stepId: 'decision', level: 1 },
      { kind: 'hint', stepId: 'decision', level: 2 },
    ])
    const minor = screen.getByRole('button', {
      name: 'Minor account; follow bank and guardian requirements',
    })
    minor.focus()
    await user.keyboard(' ')
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'decision', correct: true })
    await user.click(screen.getByRole('button', { name: 'Passport — fictional sample' }))
    expect(
      onEvent.mock.calls.filter(([event]) => event.kind === 'choice' && event.correct),
    ).toHaveLength(2)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Simulated — never enter real details')).toBeTruthy()
    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })
})

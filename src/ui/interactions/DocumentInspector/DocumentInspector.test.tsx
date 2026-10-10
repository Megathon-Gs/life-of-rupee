import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DocumentInspectorConfig } from '@/core/contracts'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { DocumentInspector } from './DocumentInspector'

const config: DocumentInspectorConfig = {
  titleKey: 'l02:lesson.title',
  promptKey: 'l02:lesson.prompt',
  fields: [
    {
      id: 'document',
      labelKey: 'l02:lesson.documentLabel',
      valueKey: 'l02:lesson.documentValue',
      isAnswer: true,
    },
    {
      id: 'schoolCard',
      labelKey: 'l02:lesson.schoolCardLabel',
      valueKey: 'l02:lesson.schoolCardValue',
      isAnswer: false,
      error: 'kyc.wrong_document',
    },
  ],
}
const panel = (props: React.ComponentProps<typeof DocumentInspector>) => (
  <PanelShell open onOpenChange={vi.fn()} title="Document">
    <DocumentInspector {...props} />
  </PanelShell>
)

describe('DocumentInspector', () => {
  it('emits wrong region errors, two hints, and completes once on the correct region', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    const { container } = renderUi(
      panel({ config, locale: 'en', onEvent, onComplete, stepId: 'lesson' }),
    )

    await user.click(screen.getByRole('button', { name: 'Choose Another document type' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'lesson',
      correct: false,
      error: 'kyc.wrong_document',
    })
    expect(
      screen.getByText('That choice does not fit this fictional task. You can try again.'),
    ).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Why is this incorrect?' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'explanationOpened', stepId: 'lesson' })
    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    await user.click(screen.getByRole('button', { name: 'Show a hint' }))
    expect(onEvent.mock.calls.slice(-2).map(([event]) => event)).toEqual([
      { kind: 'hint', stepId: 'lesson', level: 1 },
      { kind: 'hint', stepId: 'lesson', level: 2 },
    ])
    const correctChoice = screen.getByRole('button', { name: 'Choose Document type' })
    correctChoice.focus()
    await user.keyboard('{Enter}')
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'lesson', correct: true })
    await user.click(correctChoice)
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Inspect a fictional identity document')).toBeTruthy()
    expect(
      screen.getByText(
        'Tap the document type that can be used as an officially valid document in applicable KYC checks.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Simulated — never enter real details')).toBeTruthy()
    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })
})

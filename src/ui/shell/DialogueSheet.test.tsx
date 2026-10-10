import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderUi } from '../testing/renderUi'
import { DialogueSheet } from './DialogueSheet'

describe('DialogueSheet', () => {
  it('shows at most three lines', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderUi(<DialogueSheet speaker="Bank staff" lines={['one', 'two', 'three', 'four']} onContinue={vi.fn()} />)
    expect(screen.getByText('three')).toBeTruthy()
    expect(screen.queryByText('four')).toBeNull()
    expect(screen.getByRole('region', { name: 'Conversation with Bank staff' })).toBeTruthy()
  })

  it('continues, skips, and reads Done on the last beat', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    const onSkip = vi.fn()
    renderUi(<DialogueSheet speaker="Bank staff" lines={['Hello']} isLast onContinue={onContinue} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: 'Skip conversation' }))
    expect(onContinue).toHaveBeenCalledOnce()
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('hides Skip when no handler is given', () => {
    renderUi(<DialogueSheet speaker="Bank staff" lines={['Hello']} onContinue={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Skip conversation' })).toBeNull()
  })
})

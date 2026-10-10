import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderUi } from '../testing/renderUi'
import { Hud } from './Hud'

const props = {
  chapter: 'Chapter 1: Your first account',
  location: 'Bank',
  progress: { current: 2, total: 5 },
  canGoPrevious: true,
  canGoNext: true,
}

describe('Hud', () => {
  it('shows chapter, location and progress as text', () => {
    renderUi(<Hud {...props} onPrevious={vi.fn()} onNext={vi.fn()} onOpenSettings={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Bank' })).toBeTruthy()
    expect(screen.getByText('Chapter 1: Your first account')).toBeTruthy()
    expect(screen.getByText('Place 2 of 5')).toBeTruthy()
  })

  it('tabs in reading order: settings, previous, next', async () => {
    const user = userEvent.setup()
    renderUi(<Hud {...props} onPrevious={vi.fn()} onNext={vi.fn()} onOpenSettings={vi.fn()} />)
    const expected = ['Settings', 'Previous place', 'Next place']
    for (const name of expected) {
      await user.tab()
      expect(document.activeElement).toBe(screen.getByRole('button', { name }))
    }
  })

  it('calls the navigation handlers and skips a disabled direction', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const onOpenSettings = vi.fn()
    renderUi(<Hud {...props} canGoPrevious={false} onPrevious={onPrevious} onNext={onNext} onOpenSettings={onOpenSettings} />)
    await user.click(screen.getByRole('button', { name: 'Next place' }))
    await user.click(screen.getByRole('button', { name: 'Previous place' }))
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(onNext).toHaveBeenCalledOnce()
    expect(onPrevious).not.toHaveBeenCalled()
    expect(onOpenSettings).toHaveBeenCalledOnce()
  })

  it('shows a skill tree button only when a handler is given, before settings', async () => {
    const user = userEvent.setup()
    const onOpenSkillTree = vi.fn()
    const { unmount } = renderUi(<Hud {...props} onPrevious={vi.fn()} onNext={vi.fn()} onOpenSettings={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Skill tree' })).toBeNull()
    unmount()
    renderUi(
      <Hud {...props} onPrevious={vi.fn()} onNext={vi.fn()} onOpenSettings={vi.fn()} onOpenSkillTree={onOpenSkillTree} />,
    )
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Skill tree' }))
    await user.keyboard('{Enter}')
    expect(onOpenSkillTree).toHaveBeenCalledOnce()
  })

  it('renders Telugu labels', () => {
    renderUi(<Hud {...props} onPrevious={vi.fn()} onNext={vi.fn()} onOpenSettings={vi.fn()} />, { locale: 'te' })
    expect(screen.getByRole('button', { name: 'తర్వాతి స్థలం' })).toBeTruthy()
  })
})

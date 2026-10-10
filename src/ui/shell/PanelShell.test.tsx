import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderUi } from '../testing/renderUi'
import { Button } from './Button'
import { PanelShell } from './PanelShell'

function Harness({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open form</Button>
      <PanelShell
        open={open}
        title="Account form"
        onOpenChange={next => {
          onOpenChange(next)
          setOpen(next)
        }}
        footer={<Button>Submit</Button>}
      >
        <Button>Passport</Button>
      </PanelShell>
    </>
  )
}

describe('PanelShell', () => {
  it('reports opening, moves focus inside and labels the dialog', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderUi(<Harness onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole('button', { name: 'Open form' }))
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    const dialog = screen.getByRole('dialog', { name: 'Account form' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('traps Tab inside the panel in reading order', async () => {
    const user = userEvent.setup()
    renderUi(<Harness onOpenChange={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Open form' }))
    const order = ['Close', 'Passport', 'Submit', 'Close']
    expect(document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent).toBe(order[0])
    for (const name of order.slice(1)) {
      await user.tab()
      expect(document.activeElement).toBe(screen.getByRole('button', { name }))
    }
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Submit' }))
  })

  it('closes on Escape and returns focus to the opener', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderUi(<Harness onOpenChange={onOpenChange} />)
    const opener = screen.getByRole('button', { name: 'Open form' })
    await user.click(opener)
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('closes from the Close button and returns focus', async () => {
    const user = userEvent.setup()
    renderUi(<Harness onOpenChange={() => {}} />)
    const opener = screen.getByRole('button', { name: 'Open form' })
    await user.click(opener)
    await act(() => user.click(screen.getByRole('button', { name: 'Close' })))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })
})

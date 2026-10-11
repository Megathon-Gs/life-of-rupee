import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { ReceiptInspectorConfig } from '@/core/contracts'
import { formatINR, rupees } from '@/core/finance/money'
import { receiptTotals } from '@/core/finance/receipt'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { ReceiptInspector } from './ReceiptInspector'

// Inputs only: prices, a rate and quantities. No derived total is typed in.
const config: ReceiptInspectorConfig = {
  titleKey: 'receiptInspector:sample.title',
  promptKey: 'receiptInspector:sample.prompt',
  hintKeys: ['receiptInspector:sample.hint1', 'receiptInspector:sample.hint2'],
  explanationKey: 'receiptInspector:sample.explanation',
  items: [
    {
      id: 'rice',
      labelKey: 'receiptInspector:sample.item.rice',
      unitPricePaise: rupees(250),
      quantity: 2,
    },
    { id: 'soap', labelKey: 'receiptInspector:sample.item.soap', unitPricePaise: rupees(40) },
  ],
  discountPaise: rupees(50),
  taxRatePct: 18,
  taxOnDiscounted: true,
  errors: { missedTax: 'receipt.missed_tax', discountBeforeTax: 'receipt.discount_before_tax' },
}

const expected = receiptTotals(
  [
    { unitPrice: rupees(250), quantity: 2 },
    { unitPrice: rupees(40), quantity: 1 },
  ],
  { discount: rupees(50), taxRatePct: 18, taxOnDiscounted: true },
)

const mount = (onEvent = vi.fn(), onComplete = vi.fn()) =>
  renderUi(
    <PanelShell open onOpenChange={vi.fn()} title="Receipt">
      <ReceiptInspector
        config={config}
        locale="en"
        onEvent={onEvent}
        onComplete={onComplete}
        stepId="market"
      />
    </PanelShell>,
  )

const taxLine = () => screen.getByRole('button', { name: /Tax \(GST/ })
const subtotalLine = () => screen.getByRole('button', { name: /Subtotal before discount/ })
const totalLine = () => screen.getByRole('button', { name: /Total to pay/ })

describe('ReceiptInspector', () => {
  it('renders every receipt number from finance, with no text input', async () => {
    const { container } = mount()
    // Finance-derived, not typed into content.
    expect(screen.getByText(formatINR(expected.subtotal, 'en'))).toBeTruthy()
    expect(screen.getByText(formatINR(expected.discount, 'en'))).toBeTruthy()
    expect(screen.getByText(formatINR(expected.tax, 'en'))).toBeTruthy()
    expect(screen.getByText(formatINR(expected.total, 'en'))).toBeTruthy()
    expect(Object.keys(config)).not.toEqual(expect.arrayContaining(['taxPaise', 'totalPaise']))
    expect(screen.getByText('Simulated — never enter real details')).toBeTruthy()
    // GST rate is shown as an assumption.
    expect(screen.getByText(/GST 18% assumed/)).toBeTruthy()
    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it('reports missed_tax (major) when the tax line is not the one tapped', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    mount(onEvent)
    const line = subtotalLine()
    line.focus()
    await user.keyboard('{Enter}')
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'market',
      correct: false,
      error: 'receipt.missed_tax',
      severity: 'major',
    })
    await user.click(screen.getByRole('button', { name: 'Why is this incorrect?' }))
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'explanationOpened', stepId: 'market' })
    await user.click(taxLine())
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'market', correct: true })
  })

  it('reports discount_before_tax when the discounted subtotal is called the payable, then completes once on the total', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    const onComplete = vi.fn()
    mount(onEvent, onComplete)
    await user.click(taxLine())
    await user.click(subtotalLine())
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'market',
      correct: false,
      error: 'receipt.discount_before_tax',
      severity: 'major',
    })
    await user.click(totalLine())
    expect(onEvent).toHaveBeenLastCalledWith({ kind: 'choice', stepId: 'market', correct: true })
    await user.click(totalLine())
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('offers two hints over keyboard', async () => {
    const user = userEvent.setup()
    const onEvent = vi.fn()
    mount(onEvent)
    const hint = screen.getByRole('button', { name: 'Show a hint' })
    hint.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { kind: 'hint', stepId: 'market', level: 1 },
      { kind: 'hint', stepId: 'market', level: 2 },
    ])
  })
})

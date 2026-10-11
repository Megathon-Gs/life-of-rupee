import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { InteractionEvent, ScenarioChainConfig } from '@/core/contracts'
import { defaultRubric, score } from '@/core/scoring'
import { PanelShell } from '@/ui/shell'
import { axeViolations } from '@/ui/testing/axe'
import { renderUi } from '@/ui/testing/renderUi'
import { ScenarioChain, type CarryValues } from './ScenarioChain'

type StubProps = {
  config: { label?: string; availablePaise?: number; outputs?: CarryValues; right?: boolean }
  stepId: string
  onEvent: (event: InteractionEvent) => void
  onComplete: (result?: { carry?: CarryValues }) => void
}

/** Stand-in kit component: a wrong tap, then a right tap that hands `outputs` on. */
function Stub({ config, stepId, onEvent, onComplete }: StubProps) {
  return (
    <div>
      <p data-testid="stub-config">{JSON.stringify(config)}</p>
      <button
        onClick={() =>
          onEvent({
            kind: 'choice',
            stepId,
            correct: false,
            error: 'budget.no_savings',
            severity: 'minor',
          })
        }
      >
        {config.label} wrong
      </button>
      <button
        onClick={() => {
          if (config.right) onEvent({ kind: 'choice', stepId, correct: true })
          onComplete({ carry: config.outputs })
        }}
      >
        {config.label} done
      </button>
    </div>
  )
}

const registry = { stub: Stub }

const config: ScenarioChainConfig = {
  titleKey: 'scenarioChain:sample.title',
  promptKey: 'scenarioChain:sample.prompt',
  hintKeys: ['scenarioChain:sample.hint1', 'scenarioChain:sample.hint2'],
  explanationKey: 'scenarioChain:sample.explanation',
  links: [
    {
      interaction: 'stub',
      config: { label: 'Budget', outputs: { availablePaise: 450000, ignored: 1 } },
      carry: ['availablePaise'],
    },
    { interaction: 'stub', config: { label: 'Loan', availablePaise: 1, outputs: {} } },
    { interaction: 'stub', config: { label: 'Saving' } },
  ],
}

const mount = (props: Partial<Parameters<typeof ScenarioChain>[0]> = {}) => {
  const onEvent = vi.fn()
  const onComplete = vi.fn()
  const view = renderUi(
    <PanelShell open onOpenChange={vi.fn()} title="Month">
      <ScenarioChain
        config={config}
        locale="en"
        onEvent={onEvent}
        onComplete={onComplete}
        stepId="month"
        registry={registry}
        {...props}
      />
    </PanelShell>,
  )
  return { ...view, onEvent, onComplete }
}

const shownConfig = () => JSON.parse(screen.getByTestId('stub-config').textContent ?? '{}')

describe('ScenarioChain', () => {
  it('runs a 3-link chain in order and completes once', async () => {
    const user = userEvent.setup()
    const { onComplete } = mount()
    for (const [i, label] of ['Budget', 'Loan', 'Saving'].entries()) {
      expect(screen.getByTestId('chain-link').dataset.link).toBe(String(i))
      expect(shownConfig().label).toBe(label)
      expect(onComplete).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: `${label} done` }))
    }
    expect(onComplete).toHaveBeenCalledTimes(1)
    // A late duplicate completion from the last link cannot complete twice.
    await user.click(screen.getByRole('button', { name: 'Saving done' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('carries only the named values into the next link config, and no further', async () => {
    const user = userEvent.setup()
    mount()
    expect(shownConfig().availablePaise).toBeUndefined()
    await user.click(screen.getByRole('button', { name: 'Budget done' }))
    expect(shownConfig()).toEqual({ label: 'Loan', availablePaise: 450000, outputs: {} })
    await user.click(screen.getByRole('button', { name: 'Loan done' }))
    expect(shownConfig()).toEqual({ label: 'Saving' })
  })

  it('re-emits child events under the chain step id, never a suffixed one', async () => {
    const user = userEvent.setup()
    const { onEvent } = mount()
    await user.click(screen.getByRole('button', { name: 'Budget wrong' }))
    expect(onEvent).toHaveBeenLastCalledWith({
      kind: 'choice',
      stepId: 'month',
      correct: false,
      error: 'budget.no_savings',
      severity: 'minor',
    })
    await user.click(screen.getByRole('button', { name: 'Budget done' }))
    await user.click(screen.getByRole('button', { name: 'Loan wrong' }))
    expect(onEvent).toHaveBeenLastCalledWith(expect.objectContaining({ stepId: 'month' }))
  })

  it('resumes at link 2 without replaying link 1', async () => {
    const user = userEvent.setup()
    const onLinkChange = vi.fn()
    const { onEvent, onComplete } = mount({
      initialLink: 1,
      initialCarried: { availablePaise: 450000 },
      onLinkChange,
    })
    expect(onEvent).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Budget done' })).toBeNull()
    expect(shownConfig()).toEqual({ label: 'Loan', availablePaise: 450000, outputs: {} })
    await user.click(screen.getByRole('button', { name: 'Loan done' }))
    expect(onLinkChange).toHaveBeenCalledWith(2, {})
    await user.click(screen.getByRole('button', { name: 'Saving done' }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onEvent).not.toHaveBeenCalled()
  })

  it('shows a progress strip that tracks the current link', async () => {
    const user = userEvent.setup()
    mount()
    const strip = screen.getByRole('list', { name: 'Progress through this month' })
    const states = () =>
      Array.from(strip.querySelectorAll('li')).map((li) => li.getAttribute('data-state'))
    expect(states()).toEqual(['current', 'todo', 'todo'])
    await user.click(screen.getByRole('button', { name: 'Budget done' }))
    expect(states()).toEqual(['done', 'current', 'todo'])
    expect(strip.querySelector('[aria-current="step"]')?.textContent).toContain('Step 2 of 3')
  })

  it('offers two hints and the explanation after a wrong choice', async () => {
    const user = userEvent.setup()
    const { onEvent } = mount()
    expect(screen.queryByRole('button', { name: 'Why is this incorrect?' })).toBeNull()
    const hint = screen.getByRole('button', { name: 'Show a hint' })
    hint.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Budget wrong' }))
    await user.click(screen.getByRole('button', { name: 'Why is this incorrect?' }))
    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      { kind: 'hint', stepId: 'month', level: 1 },
      { kind: 'hint', stepId: 'month', level: 2 },
      expect.objectContaining({ kind: 'choice', stepId: 'month' }),
      { kind: 'explanationOpened', stepId: 'month' },
    ])
    expect(hint.hasAttribute('disabled')).toBe(true)
  })

  it('moves focus into the chain when a link finishes, and has no text inputs or a11y violations', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await user.click(screen.getByRole('button', { name: 'Budget done' }))
    expect(document.activeElement?.tagName).toBe('H3')
    expect(screen.getByText('Simulated — never enter real details')).toBeTruthy()
    expect(
      container.querySelector('input[type="text"], textarea, [contenteditable="true"]'),
    ).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it('scores 3 stars through score() for an all-correct chain in the decision step', async () => {
    const user = userEvent.setup()
    const right = (label: string): ScenarioChainConfig['links'][number] => ({
      interaction: 'stub',
      config: { label, right: true },
    })
    const { onEvent } = mount({
      stepId: 'decision',
      config: { ...config, links: [right('A'), right('B'), right('C')] },
    })
    for (const label of ['A', 'B', 'C']) {
      await user.click(screen.getByRole('button', { name: `${label} done` }))
    }
    const events = onEvent.mock.calls.map(([event]) => event as InteractionEvent)
    expect(events).toHaveLength(3)
    expect(events.every((event) => event.stepId === 'decision')).toBe(true)
    expect(score(events, defaultRubric).stars).toBe(3)
  })

  it('shows a notice instead of crashing for an unregistered interaction', () => {
    mount({ registry: {} })
    expect(screen.getByRole('alert').textContent).toBe('This step is not available yet.')
  })
})

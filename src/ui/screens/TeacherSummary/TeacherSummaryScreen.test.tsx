import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TeacherSummary } from '@/core/contracts'
import source from './TeacherSummaryScreen.tsx?raw'
import { renderUi } from '../../testing/renderUi'
import { TeacherSummaryScreen, type TeacherError } from './TeacherSummaryScreen'

const summary: TeacherSummary = {
  starsByBranch: [
    { labelKey: 'branch.money-management', stars: 5 },
    { labelKey: 'branch.financial-access', stars: 2 },
    { labelKey: 'branch.financial-safety', stars: 0 },
  ],
  levelsCompleted: 4,
}

const topErrors: TeacherError[] = [
  { code: 'upi.pin_to_receive', count: 3 },
  { code: 'fraud.shared_otp', count: 1 },
]

const render = (
  overrides: { summary?: TeacherSummary; topErrors?: TeacherError[]; onBack?: () => void } = {},
) =>
  renderUi(
    <TeacherSummaryScreen
      summary={overrides.summary ?? summary}
      topErrors={overrides.topErrors ?? topErrors}
      onBack={overrides.onBack}
    />,
  )

describe('TeacherSummaryScreen', () => {
  it('shows levels finished, stars per branch and plain-word mistakes', () => {
    render()
    expect(screen.getByRole('region', { name: 'Show my teacher' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Show my teacher' })).toBeTruthy()
    expect(screen.getByText('4 levels finished')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 3, name: 'Stars by skill' })).toBeTruthy()
    expect(screen.getByText('Money Management')).toBeTruthy()
    expect(screen.getByText('5 stars')).toBeTruthy()
    expect(screen.getByText('Financial Safety')).toBeTruthy()
    expect(screen.getByText('No stars yet')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 3, name: 'Mistakes to practise' })).toBeTruthy()
    expect(screen.getByText('Sharing a PIN to get money')).toBeTruthy()
    expect(screen.getByText('3 times')).toBeTruthy()
    expect(screen.getByText('Sharing an OTP with someone')).toBeTruthy()
  })

  it('falls back to a plain-word label for an unknown error code', () => {
    render({ topErrors: [{ code: 'something.new', count: 2 }] })
    expect(screen.getByText('Another mistake')).toBeTruthy()
  })

  it('shows an empty state when there are no mistakes', () => {
    render({ topErrors: [] })
    expect(screen.getByText('No mistakes to practise yet.')).toBeTruthy()
  })

  it('calls onBack when Back is pressed', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render({ onBack })
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('renders the Telugu draft', () => {
    renderUi(<TeacherSummaryScreen summary={summary} topErrors={topErrors} />, { locale: 'te' })
    expect(
      screen.getByRole('heading', { level: 2, name: 'నా ఉపాధ్యాయుడికి చూపించండి' }),
    ).toBeTruthy()
  })

  it('renders no profile id, name, sync code, raw id or timestamp', () => {
    const { container } = render()
    const text = container.textContent ?? ''
    // The screen is display-only: no learner identity, codes, or time data may appear.
    for (const forbidden of [
      'learner',
      'localId',
      'profile',
      'sync',
      'KITE',
      'student',
      'student@',
    ]) {
      expect(text.toLowerCase()).not.toContain(forbidden.toLowerCase())
    }
    // Error codes are shown as words, never as their raw identifier.
    expect(text).not.toContain('upi.pin_to_receive')
    expect(text).not.toContain('fraud.shared_otp')
    // No ISO timestamps and no attempt/level ids.
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(text).not.toMatch(/\bl\d{2}-[a-z-]+/)
  })

  it('uses no network APIs', () => {
    expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/)
  })
})

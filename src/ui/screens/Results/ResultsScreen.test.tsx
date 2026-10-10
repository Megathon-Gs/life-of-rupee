import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { skillTree } from '@/content/skillTree'
import type { ReviewItem, SkillNodeId } from '@/core/contracts'
import { STAR_REVEAL_MS } from '../../tokens'
import { renderUi } from '../../testing/renderUi'
import { ResultsScreen, parseReview } from './ResultsScreen'

const review: ReviewItem[] = [
  { error: 'kyc.wrong_document', severity: 'major', skillNode: 'access.identity' as SkillNodeId, reviewKey: 'kyc.wrong_document.review' },
]

const revealed = () => screen.getAllByTestId('result-star').map(star => star.dataset.revealed)

const results = (overrides: Partial<Parameters<typeof ResultsScreen>[0]> = {}) => (
  <ResultsScreen
    stars={2}
    reviewItems={review}
    reviewNamespace="l02"
    skillTree={skillTree}
    onRetry={vi.fn()}
    onContinue={vi.fn()}
    {...overrides}
  />
)

afterEach(() => {
  vi.useRealTimers()
})

describe('ResultsScreen', () => {
  it('shows all stars at once with reduced motion', () => {
    renderUi(results(), { reducedMotion: true })
    expect(revealed()).toEqual(['true', 'true', 'true'])
  })

  it('reveals stars one by one with full motion', () => {
    vi.useFakeTimers()
    renderUi(results(), { reducedMotion: false })
    expect(revealed()).toEqual(['false', 'false', 'false'])
    act(() => vi.advanceTimersByTime(STAR_REVEAL_MS))
    expect(revealed()).toEqual(['true', 'false', 'false'])
    act(() => vi.advanceTimersByTime(STAR_REVEAL_MS * 2))
    expect(revealed()).toEqual(['true', 'true', 'true'])
  })

  it('marks lost stars and explains them in the review', () => {
    renderUi(results(), { reducedMotion: true })
    const states = screen.getAllByTestId('result-star').map(star => star.dataset.state)
    expect(states).toEqual(['earned', 'earned', 'lost'])
    expect(screen.getByText('You earned 2 stars out of 3.')).toBeTruthy()
    expect(screen.getByText(/1 star was lost/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'What changed my result?' })).toBeTruthy()
    expect(screen.getByText('Your choice')).toBeTruthy()
    expect(screen.getByText('Safer choice')).toBeTruthy()
    expect(screen.getByText('Why it matters')).toBeTruthy()
    expect(screen.getByText(/unsupported identity-document route/)).toBeTruthy()
    expect(screen.getByText('Important mistake')).toBeTruthy()
    expect(screen.getByText('Skill: Financial Identity')).toBeTruthy()
  })

  it('puts Try again first until all three stars, and calls the handlers', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const onContinue = vi.fn()
    renderUi(results({ onRetry, onContinue }), { reducedMotion: true })
    const buttons = screen.getAllByRole('button').map(b => b.textContent)
    expect(buttons).toEqual(['Try again', 'Back to the street'])
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await user.click(screen.getByRole('button', { name: 'Back to the street' }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('leads with Back to the street on a perfect result', () => {
    renderUi(results({ stars: 3, reviewItems: [] }), { reducedMotion: true })
    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual(['Back to the street', 'Try again'])
    expect(screen.getByText('Every decision was safe. No stars lost.')).toBeTruthy()
  })

  it('renders the Telugu draft', () => {
    renderUi(results(), { locale: 'te', reducedMotion: true })
    expect(screen.getByRole('heading', { name: 'నా ఫలితం ఎందుకు మారింది?' })).toBeTruthy()
  })
})

describe('parseReview', () => {
  it('splits labelled sentences in English and Telugu', () => {
    expect(parseReview('Your choice: a. Safer choice: b; c. Why it matters: d.')).toEqual([
      { label: 'Your choice', text: 'A.' },
      { label: 'Safer choice', text: 'B; c.' },
      { label: 'Why it matters', text: 'D.' },
    ])
    expect(parseReview('మీ ఎంపిక: అ. సురక్షిత ఎంపిక: ఆ.').map(part => part.label)).toEqual(['మీ ఎంపిక', 'సురక్షిత ఎంపిక'])
  })

  it('keeps unstructured text as one paragraph', () => {
    expect(parseReview('Just a sentence.')).toEqual([{ label: '', text: 'Just a sentence.' }])
  })
})

import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { approvedEducationalLinks } from '@/content/capstone'
import en from '@/content/locales/en/capstone.json'
import te from '@/content/locales/te/capstone.json'
import { axeViolations } from '../../testing/axe'
import { renderUi } from '../../testing/renderUi'
import { CapstoneScreen } from './CapstoneScreen'

describe('CapstoneScreen', () => {
  it('keeps the screen and its strings unreachable when the feature is off', () => {
    const { container } = renderUi(<CapstoneScreen features={{ capstone: false }} />)
    expect(container.firstElementChild?.childElementCount).toBe(0)
    expect(screen.queryByText('Financial Futures Centre')).toBeNull()
  })

  it('shows the neutral centre with an assumption-labelled interactive example', () => {
    renderUi(<CapstoneScreen features={{ capstone: true }} />)
    expect(screen.getByRole('heading', { name: 'Financial Futures Centre' })).toBeTruthy()
    expect(screen.getByText(/Assumption: a fixed 5% annual rate/)).toBeTruthy()
    expect(screen.getByText('Illustration after 10 years: ₹1,628.89')).toBeTruthy()

    fireEvent.change(screen.getByRole('slider'), { target: { value: '20' } })
    expect(screen.getByText('Illustration after 20 years: ₹2,653.30')).toBeTruthy()
  })

  it('teaches diversification and time horizon without recommendations', () => {
    renderUi(<CapstoneScreen features={{ capstone: true }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Spread it across different places' }))
    expect(screen.getByText(/cannot remove risk/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Many years from now' }))
    expect(screen.getByText(/does not make an outcome certain/)).toBeTruthy()
  })

  it('does not render an external link while none are approved', () => {
    expect(approvedEducationalLinks).toEqual([])
    renderUi(<CapstoneScreen features={{ capstone: true }} />)
    expect(screen.queryByRole('navigation', { name: 'Approved learning material' })).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders an approved link as a labelled, user-initiated external link', () => {
    renderUi(
      <CapstoneScreen
        features={{ capstone: true }}
        links={[{ href: 'https://example.org/learn', labelKey: 'links.title' }]}
      />,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('https://example.org/learn')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.textContent).toMatch(/opens outside the game/)
  })

  it('keeps English and Telugu keys in step and free of partner or product names', () => {
    const keys = (o: object, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
    expect(keys(te).filter(k => !k.startsWith('_')).sort()).toEqual(keys(en).sort())
    expect(JSON.stringify(en)).not.toMatch(/vanguard/i)
  })

  it('has no axe violations', async () => {
    const { container } = renderUi(<CapstoneScreen features={{ capstone: true }} />)
    expect(await axeViolations(container)).toEqual([])
  })
})

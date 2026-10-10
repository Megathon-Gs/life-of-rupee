import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderUi } from '../testing/renderUi'
import { SettingsPanel } from './SettingsPanel'

const settings = { locale: 'en', reducedMotion: 'system', muted: false, textScale: 1 } as const

describe('SettingsPanel', () => {
  it('changes language, motion, sound and text size', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderUi(<SettingsPanel settings={settings} onChange={onChange} />)
    await user.click(screen.getByRole('radio', { name: 'తెలుగు' }))
    await user.click(screen.getByRole('radio', { name: 'Reduce motion' }))
    await user.click(screen.getByRole('switch', { name: 'Mute all sound' }))
    await user.click(screen.getByRole('radio', { name: 'Larger' }))
    expect(onChange.mock.calls).toEqual([[{ locale: 'te' }], [{ reducedMotion: true }], [{ muted: true }], [{ textScale: 1.5 }]])
  })

  it('groups each setting under a named fieldset', () => {
    renderUi(<SettingsPanel settings={settings} onChange={vi.fn()} />)
    for (const name of ['Language', 'Motion', 'Sound', 'Text size']) {
      expect(screen.getByRole('group', { name })).toBeTruthy()
    }
    expect(screen.getByRole('radio', { name: 'Match my device' })).toHaveProperty('checked', true)
  })
})

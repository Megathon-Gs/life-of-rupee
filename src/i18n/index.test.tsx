import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { changeLanguage, i18n } from './index'

function LanguageText() {
  const { t } = useTranslation('common')
  return <span>{t('language.english')}</span>
}

afterEach(async () => {
  cleanup()
  await changeLanguage('en')
})

describe('i18n', () => {
  it('changes rendered text when switching to Telugu', async () => {
    await changeLanguage('te')
    render(<I18nextProvider i18n={i18n}><LanguageText /></I18nextProvider>)
    expect(screen.getByText('ఆంగ్లం')).toBeTruthy()
  })

  it('falls back to English and marks missing Telugu text in development', async () => {
    i18n.addResource('en', 'common', 'fallbackTest', 'English fallback')
    await changeLanguage('te')
    expect(i18n.t('fallbackTest')).toBe('English fallback ⟦EN fallback⟧')
  })
})

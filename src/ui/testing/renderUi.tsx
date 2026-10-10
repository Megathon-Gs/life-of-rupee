import { cleanup, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { I18nextProvider } from 'react-i18next'
import { afterEach } from 'vitest'
import { i18n } from '@/i18n'
import type { Locale } from '@/core/contracts'
import { UiRoot, type UiSettings } from '../shell/UiRoot'

// Vitest runs without globals, so Testing Library cannot register this itself.
afterEach(cleanup)

/** Renders UI inside the i18n provider and a UiRoot, as the app will. */
export function renderUi(
  ui: ReactElement,
  { locale = 'en', reducedMotion = false }: { locale?: Locale; reducedMotion?: UiSettings['reducedMotion'] } = {},
) {
  const localized = i18n.cloneInstance({ lng: locale })
  return render(
    <I18nextProvider i18n={localized}>
      <UiRoot settings={{ locale, reducedMotion, textScale: 1 }}>{ui}</UiRoot>
    </I18nextProvider>,
  )
}

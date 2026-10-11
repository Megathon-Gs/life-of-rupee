import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import en from '@/content/locales/en/ui.json'
import te from '@/content/locales/te/ui.json'
import { axeViolations } from '../testing/axe'
import { GalleryColumn, SURFACES } from './Gallery'

const flatKeys = (value: unknown, prefix = ''): string[] =>
  value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) =>
        key.startsWith('_') ? [] : flatKeys(child, prefix ? `${prefix}.${key}` : key),
      )
    : [prefix]

afterEach(cleanup)

describe('dev gallery', () => {
  it.each(['en', 'te'] as const)('renders every surface with no axe violations (%s)', async locale => {
    const { container } = render(
      <GalleryColumn i18n={i18n} locale={locale} reducedMotion surfaces={SURFACES} />,
    )
    const stages = [...container.querySelectorAll('[data-surface]')]
    expect(stages).toHaveLength(SURFACES.length)
    // One stage = one app screen; the gallery repeats the HUD across stages.
    for (const stage of stages) {
      expect({ surface: stage.getAttribute('data-surface'), violations: await axeViolations(stage) }).toEqual({
        surface: stage.getAttribute('data-surface'),
        violations: [],
      })
    }
  }, 20_000)

  it('has a reviewed Telugu translation for every English ui string', () => {
    expect(flatKeys(te).sort()).toEqual(flatKeys(en).sort())
    expect(te._meta.translationStatus).toMatch(/reviewed and approved/)
  })
})

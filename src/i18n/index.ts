import i18next, { type Resource } from 'i18next'
import ICU from 'i18next-icu'

type LocaleModule = { default: Record<string, unknown> }
const localeFiles = import.meta.glob<LocaleModule>('/src/content/locales/*/*.json', { eager: true })
const resources: Resource = {}

for (const [path, module] of Object.entries(localeFiles)) {
  const [, language, namespace] = path.match(/\/locales\/([^/]+)\/([^/]+)\.json$/) ?? []
  if (!language || !namespace) continue
  resources[language] ??= {}
  resources[language]![namespace] = module.default
}

const missingTeluguMarker = {
  name: 'missingTeluguMarker',
  type: 'postProcessor' as const,
  process(value: string, key: string | string[], options: Record<string, unknown>, translator: typeof i18next) {
    if (!import.meta.env.DEV || !translator.language?.startsWith('te')) return value
    const missing = (Array.isArray(key) ? key : [key]).some(item =>
      !translator.exists(item, { ...options, lng: 'te', fallbackLng: false }),
    )
    return missing ? `${value} ⟦EN fallback⟧` : value
  },
}

i18next.use(ICU).use(missingTeluguMarker).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: [...new Set(Object.keys(resources).flatMap(language => Object.keys(resources[language] ?? {})))],
  interpolation: { escapeValue: false },
  postProcess: ['missingTeluguMarker'],
})

export const i18n = i18next
export const changeLanguage = (language: 'en' | 'te') => i18next.changeLanguage(language)

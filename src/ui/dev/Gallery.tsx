import { useMemo, useState, type ReactNode } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import type { i18n as I18n } from 'i18next'
import type { Locale } from '@/core/contracts'
import { skillTree } from '@/content/skillTree'
import { Button } from '../shell/Button'
import { DialogueSheet } from '../shell/DialogueSheet'
import { Hud } from '../shell/Hud'
import { PanelShell } from '../shell/PanelShell'
import { SettingsPanel } from '../shell/SettingsPanel'
import { UiRoot, type UiSettings } from '../shell/UiRoot'
import { ResultsScreen } from '../screens/Results'
import { SkillTreeScreen } from '../screens/SkillTree'
import { DocumentPanelFixture } from './DocumentPanelFixture'
import { FIXTURE_COMPLETED, FIXTURE_JUST_LIT, FIXTURE_REVIEW, FIXTURE_TEXT, fixtureSettings } from './fixtures'
import { WorldBand } from './WorldBand'
import styles from './Gallery.module.css'

export const SURFACES = ['hud', 'dialogue', 'panel', 'results', 'skilltree', 'settings'] as const
export type Surface = (typeof SURFACES)[number]

const noop = () => {}

/** World band + HUD; `inert` while a panel is open, as the app will do. */
function Street({ locale, inert, onSettings, children }: { locale: Locale; inert?: boolean; onSettings?: () => void; children?: ReactNode }) {
  const { t } = useTranslation('world')
  return (
    <div className={styles.street} inert={inert}>
      <WorldBand />
      <Hud
        chapter={FIXTURE_TEXT[locale].chapter}
        location={t('loc.bank')}
        progress={{ current: 2, total: 5 }}
        canGoPrevious
        canGoNext
        onPrevious={noop}
        onNext={noop}
        onOpenSettings={onSettings ?? noop}
      />
      {children}
    </div>
  )
}

function PanelDemo({ locale }: { locale: Locale }) {
  const { t } = useTranslation(['l02', 'ui'])
  const [open, setOpen] = useState(true)
  return (
    <>
      <Street locale={locale} inert={open}>
        <div className={styles.entrance}>
          <Button variant="primary" onClick={() => setOpen(true)}>
            {t('lesson.title')}
          </Button>
        </div>
      </Street>
      <PanelShell
        open={open}
        onOpenChange={setOpen}
        title={t('lesson.title')}
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t('dialogue.continue', { ns: 'ui' })}
          </Button>
        }
      >
        <DocumentPanelFixture />
      </PanelShell>
    </>
  )
}

function SettingsDemo({ locale, settings, onChange }: { locale: Locale; settings: UiSettings; onChange: (patch: Partial<UiSettings>) => void }) {
  const { t } = useTranslation('ui')
  const [open, setOpen] = useState(true)
  return (
    <>
      <Street locale={locale} inert={open} onSettings={() => setOpen(true)} />
      <PanelShell
        open={open}
        onOpenChange={setOpen}
        title={t('settings.title')}
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t('settings.done')}
          </Button>
        }
      >
        <SettingsPanel settings={settings} onChange={onChange} />
      </PanelShell>
    </>
  )
}

function SurfaceDemo({ surface, locale, settings, onSettingsChange }: {
  surface: Surface
  locale: Locale
  settings: UiSettings
  onSettingsChange: (patch: Partial<UiSettings>) => void
}) {
  switch (surface) {
    case 'hud':
      return <Street locale={locale} />
    case 'dialogue':
      return (
        <Street locale={locale}>
          <DialogueSheet speaker={FIXTURE_TEXT[locale].speaker} lines={FIXTURE_TEXT[locale].lines} onContinue={noop} onSkip={noop} />
        </Street>
      )
    case 'panel':
      return <PanelDemo locale={locale} />
    case 'results':
      return (
        <ResultsScreen
          stars={2}
          reviewItems={FIXTURE_REVIEW}
          reviewNamespace="l02"
          skillTree={skillTree}
          onRetry={noop}
          onContinue={noop}
        />
      )
    case 'skilltree':
      return <SkillTreeScreen tree={skillTree} completed={FIXTURE_COMPLETED} justLit={FIXTURE_JUST_LIT} onBack={noop} />
    case 'settings':
      return <SettingsDemo locale={locale} settings={settings} onChange={onSettingsChange} />
  }
}

export interface GalleryColumnProps {
  i18n: I18n
  locale: Locale
  reducedMotion: UiSettings['reducedMotion']
  surfaces: readonly Surface[]
  /** One surface filling the viewport (for frame screenshots), no gallery labels. */
  solo?: boolean
}

/** Every requested surface for one locale, each in its own stage. */
export function GalleryColumn({ i18n, locale, reducedMotion, surfaces, solo = false }: GalleryColumnProps) {
  const localized = useMemo(() => i18n.cloneInstance({ lng: locale }), [i18n, locale])
  const [settings, setSettings] = useState(() => fixtureSettings(locale, reducedMotion))
  const onSettingsChange = (patch: Partial<UiSettings>) => setSettings(current => ({ ...current, ...patch }))
  const rootSettings = { ...settings, locale }
  return (
    <I18nextProvider i18n={localized}>
      <UiRoot settings={rootSettings} className={solo ? styles.soloRoot : styles.column}>
        {surfaces.map(surface => (
          <section key={surface} className={solo ? styles.soloStage : styles.block} aria-label={solo ? undefined : `${surface} (${locale})`}>
            {!solo && <h2 className={styles.label}>{`${surface} (${locale})`}</h2>}
            <div className={solo ? styles.soloFrame : styles.stage} data-surface={surface}>
              <SurfaceDemo surface={surface} locale={locale} settings={settings} onSettingsChange={onSettingsChange} />
            </div>
          </section>
        ))}
      </UiRoot>
    </I18nextProvider>
  )
}

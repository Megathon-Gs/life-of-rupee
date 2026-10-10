import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import type { LevelDef, ProfileSummary, SaveFile, SaveStore } from '@/core/contracts'
import { world } from '@/content/world'
import { changeLanguage, i18n } from '@/i18n'
import { UiRoot } from '@/ui/shell'
import type { AppMode } from './mode'
import { ProfilePicker } from './ProfilePicker'
import { createGameStore, GameStoreContext, useGame, type GameStore } from './store'
import styles from './App.module.css'

/** localStorage key holding the last player picked on this device. */
export const LAST_PROFILE_KEY = 'paisa.lastProfile'

/** The last player picked on this device, or null if none or storage is blocked. */
export const readLastProfile = (): string | null => {
  try {
    return localStorage.getItem(LAST_PROFILE_KEY)
  } catch {
    return null
  }
}

/** Remembers (or with null, forgets) the player to resume on next launch. */
export const writeLastProfile = (localId: string | null) => {
  try {
    if (localId) localStorage.setItem(LAST_PROFILE_KEY, localId)
    else localStorage.removeItem(LAST_PROFILE_KEY)
  } catch {
    // Storage blocked: the picker simply shows on every launch.
  }
}

type Phase =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'picker'; profiles: ProfileSummary[] }
  | { kind: 'playing'; store: GameStore }

export interface AppProps {
  mode: AppMode
  saveStore: SaveStore
  /** Levels for this launch, resolved at boot. */
  loadLevels: () => Promise<LevelDef[]>
}

/** Boot after i18n and the save store exist: levels → last profile or picker → game. */
export function App({ mode, saveStore, loadLevels }: AppProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [levels, setLevels] = useState<LevelDef[]>([])
  const [busy, setBusy] = useState(false)

  const play = useCallback(
    (file: SaveFile, allLevels: readonly LevelDef[]) => {
      writeLastProfile(file.learner.localId)
      const store = createGameStore(
        file,
        { levels: allLevels, locations: world.locations },
        (save) => void saveStore.save(save),
      )
      setPhase({ kind: 'playing', store })
    },
    [saveStore],
  )

  const showPicker = useCallback(async () => {
    setPhase({ kind: 'picker', profiles: await saveStore.listProfiles() })
  }, [saveStore])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const loaded = await loadLevels()
      const lastId = readLastProfile()
      const file = lastId ? await saveStore.load(lastId).catch(() => undefined) : undefined
      if (cancelled) return
      setLevels(loaded)
      if (file) play(file, loaded)
      else await showPicker()
    })().catch(() => {
      if (!cancelled) setPhase({ kind: 'failed' })
    })
    return () => {
      cancelled = true
    }
  }, [loadLevels, play, saveStore, showPicker])

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    try {
      await task()
    } finally {
      setBusy(false)
    }
  }

  const content = (() => {
    switch (phase.kind) {
      case 'loading':
      case 'failed':
        return <Status failed={phase.kind === 'failed'} />
      case 'picker':
        return (
          <ProfilePicker
            profiles={phase.profiles}
            busy={busy}
            onCreate={() => void run(async () => play(await saveStore.createProfile(), levels))}
            onSelect={(localId) =>
              void run(async () => {
                const file = await saveStore.load(localId)
                if (file) play(file, levels)
                else await showPicker()
              })
            }
            onRemove={(localId) =>
              void run(async () => {
                await saveStore.removeProfile(localId)
                if (readLastProfile() === localId) writeLastProfile(null)
                await showPicker()
              })
            }
          />
        )
      case 'playing':
        return (
          <GameStoreContext.Provider value={phase.store}>
            <Playing>
              <Suspense fallback={<Status failed={false} />}>
                <Game
                  mode={mode}
                  levels={levels}
                  saveStore={saveStore}
                  onSwitchProfile={() =>
                    void run(async () => {
                      await saveStore.flush()
                      writeLastProfile(null)
                      await showPicker()
                    })
                  }
                />
              </Suspense>
            </Playing>
          </GameStoreContext.Provider>
        )
    }
  })()

  return (
    <I18nextProvider i18n={i18n}>
      {phase.kind === 'playing' ? content : <Shell>{content}</Shell>}
    </I18nextProvider>
  )
}

// Loaded on demand so Pixi and GSAP stay out of the main chunk until a profile is picked.
const Game = lazy(() => import('./Game').then((module) => ({ default: module.Game })))

const DEFAULT_SETTINGS = { locale: 'en', reducedMotion: 'system', textScale: 1 } as const

/** UiRoot for screens before a profile is loaded. */
function Shell({ children }: { children: ReactNode }) {
  useLocale(DEFAULT_SETTINGS.locale)
  return (
    <UiRoot settings={DEFAULT_SETTINGS} className={styles.root}>
      {children}
    </UiRoot>
  )
}

/** UiRoot driven by the playing profile's saved settings. */
function Playing({ children }: { children: ReactNode }) {
  const settings = useGame((s) => s.save.settings)
  useLocale(settings.locale)
  const rootSettings = useMemo(
    () => ({
      locale: settings.locale,
      reducedMotion: settings.reducedMotion,
      textScale: settings.textScale,
    }),
    [settings.locale, settings.reducedMotion, settings.textScale],
  )
  return (
    <UiRoot settings={rootSettings} className={styles.root}>
      {children}
    </UiRoot>
  )
}

/** Keeps i18next and `<html lang>` on the given locale. */
function useLocale(locale: SaveFile['settings']['locale']) {
  useEffect(() => {
    void changeLanguage(locale)
    document.documentElement.lang = locale
  }, [locale])
}

function Status({ failed }: { failed: boolean }) {
  const { t } = useTranslation('app')
  return (
    <p className={styles.status} role={failed ? 'alert' : 'status'}>
      {failed ? t('boot.failed') : t('boot.loading')}
    </p>
  )
}

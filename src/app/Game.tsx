import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LevelDef, LocationId, SaveStore, TravelCommand } from '@/core/contracts'
import { deriveWorldVisuals } from '@/core/worldVisuals'
import { world } from '@/content/world'
import { attachTravelInput, createTravelMachine } from '@/input'
import {
  Button,
  Hud,
  PanelShell,
  SettingsPanel,
  useReducedMotion,
  type UiSettings,
} from '@/ui/shell'
import { PixiWorldRenderer } from '@/world'
import { LevelPanel } from './LevelPanel'
import { levelAt } from './levels'
import type { AppMode } from './mode'
import { useDerived, useGame, useGameStore } from './store'
import { createTextureProvider } from './textures'
import { BANK_ENTRY_ID, onArrive, transitionPanel } from './transitions'
import styles from './App.module.css'

const ids = world.locations.map((location) => location.id)

/** Location a travel command leads to; steps stop at either end of the street. */
export function travelTarget(current: LocationId, cmd: TravelCommand): LocationId {
  if (cmd.kind === 'goto') return ids.includes(cmd.id) ? cmd.id : current
  const index = ids.indexOf(current)
  return ids[Math.min(ids.length - 1, Math.max(0, index + cmd.dir))] ?? current
}

type Panel = { kind: 'level'; level: LevelDef } | { kind: 'settings' }

export interface GameProps {
  mode: AppMode
  levels: readonly LevelDef[]
  saveStore: SaveStore
  onSwitchProfile: () => void
}

/** The street (world band, HUD, door cue) plus the level and settings panels over it. */
export function Game({ mode, levels, saveStore, onSwitchProfile }: GameProps) {
  const { t } = useTranslation(['app', 'world', 'ui'])
  const store = useGameStore()
  const derived = useDerived()
  const locationId = useGame((s) => s.save.position.locationId)
  const settings = useGame((s) => s.save.settings)
  const reducedMotion = useReducedMotion()

  const bandRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const doorRef = useRef<HTMLButtonElement>(null)
  const rendererRef = useRef<PixiWorldRenderer | null>(null)
  const [machine] = useState(() => createTravelMachine())
  const [ready, setReady] = useState(false)
  const [travelling, setTravelling] = useState(false)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [skipTransition, setSkipTransition] = useState<(() => void) | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const panelHostRef = useRef<HTMLDivElement>(null)
  const entryRef = useRef<{ door: DOMRect; seen: boolean } | null>(null)
  const transitionRef = useRef<AbortController | null>(null)
  const closingRef = useRef(false)
  const arrivedRef = useRef(false)

  // Visuals follow the saved state: refreshed at mount and after each finished attempt is saved.
  const [savedDerived, setSavedDerived] = useState(() => store.derived())
  const visuals = useMemo(() => deriveWorldVisuals(savedDerived), [savedDerived])
  const level = levelAt(levels, locationId, derived.unlockedLocations)
  const location = world.locations.find((l) => l.id === locationId) ?? world.locations[0]!
  const placeName = t(location.labelKey, { ns: 'world' })

  const render = () => {
    if (mode.test) rendererRef.current?.step(16)
  }

  const runCommand = async (cmd: TravelCommand) => {
    const renderer = rendererRef.current
    const current = store.getState().save.position.locationId
    const target = travelTarget(current, cmd)
    if (!renderer || target === current) {
      machine.send({ kind: 'travelDone', t: performance.now() })
      return
    }
    setTravelling(true)
    try {
      await renderer.travelTo(target, { reducedMotion: latest.current.reducedMotion })
      render()
    } catch (error) {
      console.error('Travel failed', error)
      return
    } finally {
      machine.send({ kind: 'travelDone', t: performance.now() })
      setTravelling(false)
    }
    store.getState().dispatch({ type: 'travelled', locationId: target })
    arrivedRef.current = true
    void saveStore.flush()
  }

  // Listeners attached once read the latest closures through this ref.
  const latest = useRef({ runCommand, reducedMotion })
  useLayoutEffect(() => {
    latest.current = { runCommand, reducedMotion }
  })

  useEffect(() => {
    const band = bandRef.current
    const host = hostRef.current
    if (!band || !host) return
    const renderer = new PixiWorldRenderer({
      world,
      textures: createTextureProvider(),
      test: mode.test,
    })
    rendererRef.current = renderer
    renderer.mount(host)
    let cancelled = false
    let initialised = false
    let detach = () => {}
    void renderer.whenReady().then(async () => {
      initialised = true
      if (cancelled) return
      renderer.resize()
      await renderer.travelTo(store.getState().save.position.locationId, { reducedMotion: true })
      if (cancelled) return
      if (mode.test) renderer.step(16)
      detach = attachTravelInput(band, machine, (cmd) => void latest.current.runCommand(cmd))
      setReady(true)
    })
    const onResize = () => {
      renderer.resize()
      if (mode.test) renderer.step(16)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      detach()
      window.removeEventListener('resize', onResize)
      rendererRef.current = null
      transitionRef.current?.abort()
      // Destroying before Pixi has initialised throws, so a fast unmount (StrictMode, a quick
      // profile switch) waits for init; the renderer then removes its own canvas.
      if (initialised) renderer.destroy()
      else void renderer.whenReady().then(() => renderer.destroy())
      setReady(false)
    }
  }, [machine, mode.test, store])

  useEffect(() => {
    if (!ready) return
    rendererRef.current?.applyVisuals(visuals)
    if (mode.test) rendererRef.current?.step(16)
  }, [ready, visuals, mode.test])

  // The ticker only exists once the renderer is ready; test mode steps it by hand.
  useEffect(() => {
    if (!ready || mode.test) return
    rendererRef.current?.setPaused(panel !== null && !transitioning)
  }, [ready, panel, transitioning, mode.test])

  // After a trip ends at a building with a level, the door is the focused control,
  // so Enter goes straight in.
  useEffect(() => {
    if (travelling || !arrivedRef.current) return
    arrivedRef.current = false
    doorRef.current?.focus()
    return onArrive(doorRef.current, reducedMotion)
  }, [travelling, locationId, reducedMotion])

  useLayoutEffect(() => {
    const entry = entryRef.current
    const dialog = panelHostRef.current?.querySelector<HTMLElement>('[role="dialog"]')
    if (panel?.kind !== 'level' || !entry || !dialog) return
    const controller = new AbortController()
    transitionRef.current = controller
    const bank = panel.level.location === 'bank'
    void Promise.all([
      bank
        ? rendererRef.current?.transitionLocation(
            panel.level.location,
            reducedMotion,
            false,
            controller.signal,
          )
        : undefined,
      bank
        ? transitionPanel({
            door: entry.door,
            panel: dialog,
            reducedMotion,
            seen: entry.seen,
            test: mode.test,
            signal: controller.signal,
            onSkipReady: (skip) => {
              if (
                !skip &&
                document.activeElement?.getAttribute('data-testid') === 'skip-transition'
              ) {
                dialog.querySelector<HTMLButtonElement>('button')?.focus()
              }
              setSkipTransition(() => skip)
            },
          })
        : undefined,
    ]).then(() => {
      if (controller.signal.aborted) return
      entryRef.current = null
      if (bank) {
        store.getState().dispatch({ type: 'transitionSeen', id: BANK_ENTRY_ID })
        void saveStore.flush().catch((error: unknown) => console.error('Save failed', error))
      }
      setTransitioning(false)
    })
    return () => controller.abort()
  }, [panel, reducedMotion, mode.test, store, saveStore])

  const openPanel = (next: Panel) => {
    setPanel(next)
    machine.send({ kind: 'panelOpened' })
  }
  const closePanel = async () => {
    if (closingRef.current) return
    closingRef.current = true
    const closing = panel
    entryRef.current = null
    transitionRef.current?.abort()
    setSkipTransition(null)
    if (closing?.kind === 'level') {
      const dialog = panelHostRef.current?.querySelector<HTMLElement>('[role="dialog"]')
      const door = doorRef.current?.getBoundingClientRect()
      const controller = new AbortController()
      transitionRef.current = controller
      setTransitioning(true)
      if (closing.level.location === 'bank' && dialog && door) {
        await Promise.all([
          rendererRef.current?.transitionLocation(
            closing.level.location,
            reducedMotion,
            true,
            controller.signal,
          ),
          transitionPanel({
            door,
            panel: dialog,
            reducedMotion,
            seen: true,
            reverse: true,
            test: mode.test,
            signal: controller.signal,
            onSkipReady: () => {},
          }),
        ])
      }
      if (controller.signal.aborted) return
    }
    setTransitioning(false)
    setPanel(null)
    machine.send({ kind: 'panelClosed' })
    closingRef.current = false
  }
  const enter = () => {
    if (!level || travelling || panel || transitioning) return
    setSkipTransition(null)
    const door = doorRef.current?.getBoundingClientRect()
    if (!door) return
    entryRef.current = { door, seen: store.getState().save.seen.includes(BANK_ENTRY_ID) }
    setTransitioning(true)
    openPanel({ kind: 'level', level })
  }
  const step = (dir: 1 | -1) => {
    const cmd = machine.send({ kind: 'button', dir })
    if (cmd) void runCommand(cmd)
  }
  const changeSettings = (patch: Partial<UiSettings>) => {
    store
      .getState()
      .dispatch({ type: 'settingsUpdated', patch, updatedAt: new Date().toISOString() })
  }

  const index = ids.indexOf(locationId)
  const panelTitle = panel?.kind === 'settings' ? t('settings.title', { ns: 'ui' }) : placeName

  return (
    <>
      <div
        ref={bandRef}
        className={styles.band}
        data-testid="world-band"
        data-ready={String(ready)}
        data-location={locationId}
        data-travelling={String(travelling)}
        data-transitioning={String(transitioning)}
        data-visuals={JSON.stringify(visuals)}
        data-stars={JSON.stringify(derived.bestStars)}
        inert={panel !== null}
      >
        <div ref={hostRef} className={styles.canvas} aria-hidden="true" />
        <Hud
          chapter={t('hud.chapter')}
          location={placeName}
          progress={{ current: index + 1, total: ids.length }}
          canGoPrevious={ready && index > 0}
          canGoNext={ready && index < ids.length - 1}
          onPrevious={() => step(-1)}
          onNext={() => step(1)}
          onOpenSettings={() => openPanel({ kind: 'settings' })}
        />
        {ready && level && !travelling && (
          <div className={styles.door}>
            <Button ref={doorRef} variant="primary" data-testid="door-cue" onClick={enter}>
              {t('door.enter', { place: placeName })}
            </Button>
          </div>
        )}
      </div>
      <div ref={panelHostRef}>
        <PanelShell
          open={panel !== null}
          onOpenChange={(open) => {
            if (!open) closePanel()
          }}
          title={panelTitle}
          footer={
            panel?.kind === 'settings' ? (
              <>
                <Button data-testid="profile-switch" onClick={onSwitchProfile}>
                  {t('settings.switchProfile')}
                </Button>
                <Button variant="primary" onClick={closePanel}>
                  {t('settings.done', { ns: 'ui' })}
                </Button>
              </>
            ) : skipTransition ? (
              <Button variant="primary" data-testid="skip-transition" onClick={skipTransition}>
                {t('transition.skip')}
              </Button>
            ) : undefined
          }
        >
          {panel?.kind === 'settings' && (
            <SettingsPanel settings={settings} onChange={changeSettings} />
          )}
          {panel?.kind === 'level' && (
            <LevelPanel
              level={panel.level}
              levels={levels}
              locale={settings.locale}
              test={mode.test}
              onCompleted={async () => {
                await saveStore
                  .flush()
                  .catch((error: unknown) => console.error('Save failed', error))
                setSavedDerived(store.derived())
              }}
              onClose={closePanel}
            />
          )}
        </PanelShell>
      </div>
    </>
  )
}

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
import { GROUND_Y, PixiWorldRenderer } from '@/world'
import { LevelPanel } from './LevelPanel'
import { levelAt } from './levels'
import type { AppMode } from './mode'
import { useDerived, useGame, useGameStore } from './store'
import { loadTextureProvider } from './textures'
import { LocationLabels } from './LocationLabels'
import { stageMetrics } from './stage'
import { enterLocation, exitLocation, onArrive } from './transitions'
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
    let cancelled = false
    let initialised = false
    let detach = () => {}
    let renderer: PixiWorldRenderer | undefined
    const onResize = () => {
      renderer?.resize()
      if (mode.test) renderer?.step(16)
    }
    // The art atlases load before the renderer is built, so every texture is ready to draw.
    void loadTextureProvider().then(async (textures) => {
      if (cancelled) return
      const created = new PixiWorldRenderer({ world, textures, test: mode.test })
      renderer = created
      rendererRef.current = created
      created.onArrive((id) => void onArrive(id))
      created.mount(host)
      window.addEventListener('resize', onResize)
      await created.whenReady()
      initialised = true
      if (cancelled) return
      created.resize()
      await created.travelTo(store.getState().save.position.locationId, { reducedMotion: true })
      if (cancelled) return
      if (mode.test) created.step(16)
      detach = attachTravelInput(band, machine, (cmd) => void latest.current.runCommand(cmd))
      setReady(true)
    })
    return () => {
      cancelled = true
      detach()
      window.removeEventListener('resize', onResize)
      rendererRef.current = null
      // Destroying before Pixi has initialised throws, so a fast unmount (StrictMode, a quick
      // profile switch) waits for init; the renderer then removes its own canvas.
      const current = renderer
      if (current) {
        if (initialised) current.destroy()
        else void current.whenReady().then(() => current.destroy())
      }
      setReady(false)
    }
  }, [machine, mode.test, store])

  useEffect(() => {
    if (!ready) return
    rendererRef.current?.applyVisuals(visuals)
    if (mode.test) rendererRef.current?.step(16)
  }, [ready, visuals, mode.test])

  // While a bottom sheet is open the street is laid out in the part of the screen above it.
  useEffect(() => {
    const renderer = rendererRef.current
    if (!ready || !renderer) return
    const apply = (inset: number) => {
      renderer.setBottomInset(inset * (window.devicePixelRatio || 1))
      if (mode.test) renderer.step(16)
    }
    if (panel === null) {
      apply(0)
      return
    }
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return
    const measure = () => {
      const rect = dialog.getBoundingClientRect()
      // A side panel (wide screens) leaves the street alone; only a full-width sheet counts.
      apply(rect.width >= window.innerWidth * 0.9 ? Math.max(0, window.innerHeight - rect.top) : 0)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(dialog)
    return () => observer.disconnect()
  }, [ready, panel, mode.test])

  // The door cue sits above the protagonist, wherever the stage lands for this screen.
  useEffect(() => {
    const band = bandRef.current
    if (!ready || !band) return
    const place = () => {
      const { unit, offsetY } = stageMetrics(band)
      band.style.setProperty('--door-top', `${offsetY + (GROUND_Y - 80) * unit}px`)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [ready])

  // The ticker only exists once the renderer is ready; test mode steps it by hand.
  useEffect(() => {
    if (!ready || mode.test) return
    rendererRef.current?.setPaused(panel !== null)
  }, [ready, panel, mode.test])

  // After a trip ends at a building with a level, the door is the focused control,
  // so Enter goes straight in.
  useEffect(() => {
    if (travelling || !arrivedRef.current) return
    arrivedRef.current = false
    doorRef.current?.focus()
  }, [travelling, locationId])

  const openPanel = (next: Panel) => {
    setPanel(next)
    machine.send({ kind: 'panelOpened' })
  }
  const closePanel = () => {
    const closing = panel
    setPanel(null)
    machine.send({ kind: 'panelClosed' })
    if (closing?.kind === 'level') void exitLocation(closing.level.location)
  }
  const enter = () => {
    if (!level || travelling) return
    void enterLocation(level.location)
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
        <LocationLabels renderer={ready ? rendererRef.current : null} hidden={panel !== null} />
        {ready && level && !travelling && (
          <div className={styles.door}>
            <Button ref={doorRef} variant="primary" data-testid="door-cue" onClick={enter}>
              {t('door.enter', { place: placeName })}
            </Button>
          </div>
        )}
      </div>
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
              await saveStore.flush().catch((error: unknown) => console.error('Save failed', error))
              setSavedDerived(store.derived())
            }}
            onClose={closePanel}
          />
        )}
      </PanelShell>
    </>
  )
}

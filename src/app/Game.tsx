import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  P1_LOCATION_IDS,
  type AppConfig,
  type LevelDef,
  type LocationId,
  type SaveStore,
  type SkillNodeId,
  type TravelCommand,
} from '@/core/contracts'
import { deriveWorldVisuals } from '@/core/worldVisuals'
import { skillTree } from '@/content/skillTree'
import { interiors } from '@/content/interiors'
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
import { CapstoneScreen } from '@/ui/screens/Capstone'
import { SkillTreeScreen } from '@/ui/screens/SkillTree/SkillTreeScreen'
import { TeacherSummaryScreen } from '@/ui/screens/TeacherSummary'
import { GROUND_Y, PixiWorldRenderer } from '@/world'
import { LevelPanel } from './LevelPanel'
import { levelAt } from './levels'
import type { AppMode } from './mode'
import { useDerived, useGame, useGameStore } from './store'
import { buildTeacherSummary, topErrors } from './teacher'
import { loadTextureProvider } from './textures'
import { LocationLabels } from './LocationLabels'
import { stageMetrics } from './stage'
import { cueDoor, enterLocation, exitLocation, onArrive } from './transitions'
import styles from './App.module.css'

const ids = world.locations.map((location) => location.id)

/** Location a travel command leads to; steps stop at either end of the street. */
export function travelTarget(current: LocationId, cmd: TravelCommand): LocationId {
  if (cmd.kind === 'goto') return ids.includes(cmd.id) ? cmd.id : current
  const index = ids.indexOf(current)
  return ids[Math.min(ids.length - 1, Math.max(0, index + cmd.dir))] ?? current
}

type Panel =
  | { kind: 'level'; level: LevelDef }
  | { kind: 'settings' }
  | { kind: 'skillTree'; focusNode?: SkillNodeId }
  | { kind: 'capstone' }
  | { kind: 'teacherSummary' }

export interface GameProps {
  mode: AppMode
  levels: readonly LevelDef[]
  saveStore: SaveStore
  features: AppConfig['features']
  onSwitchProfile: () => void
}

/** The street (world band, HUD, door cue) plus the level and settings panels over it. */
export function Game({ mode, levels, saveStore, features, onSwitchProfile }: GameProps) {
  const { t } = useTranslation(['app', 'world', 'ui'])
  const store = useGameStore()
  const derived = useDerived()
  const locationId = useGame((s) => s.save.position.locationId)
  const settings = useGame((s) => s.save.settings)
  const attempts = useGame((s) => s.save.attempts)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const interior = interiors[locationId]
    if (!interior) return
    const preload = document.createElement('link')
    preload.rel = 'preload'
    preload.as = 'image'
    preload.href = interior
    document.head.append(preload)
    return () => preload.remove()
  }, [locationId])

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
  const visuals = useMemo(
    () => deriveWorldVisuals(savedDerived, { features }),
    [savedDerived, features],
  )
  // P1 locations are enterable regardless of the cosmetic lit state; P0 gating still applies.
  const enterable = useMemo(
    () => [
      ...new Set([...derived.unlockedLocations, ...P1_LOCATION_IDS.map((id) => id as LocationId)]),
    ],
    [derived.unlockedLocations],
  )
  const completedLevels = useMemo(
    () =>
      Object.entries(derived.bestStars)
        .filter(([, stars]) => stars >= 1)
        .map(([id]) => id),
    [derived.bestStars],
  )
  const level = levelAt(levels, locationId, enterable, completedLevels)
  const location = world.locations.find((l) => l.id === locationId) ?? world.locations[0]!
  const placeName = t(location.labelKey, { ns: 'world' })
  // The capstone concept opens only with its feature flag on.
  const canEnterCapstone = features.capstone && locationId === 'capstone'
  const teacherSummary = useMemo(
    () => buildTeacherSummary(derived, levels, skillTree),
    [derived, levels],
  )
  const teacherErrors = useMemo(() => topErrors(attempts), [attempts])

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
      created.onArrive(
        (id) => void onArrive(id, { reducedMotion: latest.current.reducedMotion, test: mode.test }),
      )
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

  // Keep the current location centred in the part of the street not covered by the panel.
  useEffect(() => {
    const renderer = rendererRef.current
    if (!ready || !renderer) return
    const apply = (bottom: number, side: number) => {
      const dpr = window.devicePixelRatio || 1
      renderer.setBottomInset(bottom * dpr)
      renderer.setSideInset(side * dpr)
      if (mode.test) renderer.step(16)
    }
    if (panel === null) {
      apply(0, 0)
      return
    }
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return
    const measure = () => {
      const rect = dialog.getBoundingClientRect()
      if (rect.width >= window.innerWidth * 0.9) {
        apply(Math.max(0, window.innerHeight - rect.top), 0)
      } else {
        apply(0, Math.max(0, window.innerWidth - rect.left))
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(dialog)
    window.addEventListener('resize', measure)
    dialog.addEventListener('animationend', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      dialog.removeEventListener('animationend', measure)
    }
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
    return cueDoor(doorRef.current, reducedMotion || mode.test)
  }, [travelling, locationId, reducedMotion, mode.test])

  const transitionCtx = () => ({ reducedMotion: latest.current.reducedMotion, test: mode.test })
  const openPanel = (next: Panel) => {
    setPanel(next)
    machine.send({ kind: 'panelOpened' })
  }
  const closePanel = () => {
    const closing = panel
    setPanel(null)
    machine.send({ kind: 'panelClosed' })
    if (closing?.kind === 'level') void exitLocation(closing.level.location, transitionCtx())
  }
  const openLevel = (target: LevelDef) => {
    if (!interiors[target.location]) void enterLocation(target.location, transitionCtx())
    openPanel({ kind: 'level', level: target })
  }
  const enter = () => {
    if (!level || travelling || panel) return
    openLevel(level)
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
  const panelTitle =
    panel?.kind === 'settings'
      ? t('settings.title', { ns: 'ui' })
      : panel?.kind === 'skillTree'
        ? t('skillTree.title', { ns: 'ui' })
        : panel?.kind === 'capstone'
          ? t('title', { ns: 'capstone' })
          : panel?.kind === 'teacherSummary'
            ? t('title', { ns: 'teacher' })
            : placeName
  const replayNode = async (node: SkillNodeId) => {
    const target = levels.find((candidate) => candidate.skillNodes.includes(node))
    if (!target) return
    closePanel()
    if (store.getState().save.position.locationId !== target.location) {
      await runCommand({ kind: 'goto', id: target.location })
      if (store.getState().save.position.locationId !== target.location) return
    }
    openLevel(target)
  }

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
          onOpenSkillTree={() => openPanel({ kind: 'skillTree' })}
        />
        <LocationLabels renderer={ready ? rendererRef.current : null} hidden={panel !== null} />
        {ready && (level || canEnterCapstone) && !travelling && (
          <div className={styles.door}>
            <Button
              ref={doorRef}
              variant="primary"
              data-testid="door-cue"
              onClick={() => (level ? enter() : openPanel({ kind: 'capstone' }))}
            >
              {t('door.enter', { place: placeName })}
            </Button>
          </div>
        )}
      </div>
      <div
        data-reduced-motion={String(reducedMotion)}
        className={
          panel?.kind === 'level' && interiors[panel.level.location]
            ? styles.interiorPanel
            : undefined
        }
      >
        <PanelShell
          open={panel !== null}
          onOpenChange={(open) => {
            if (!open) closePanel()
          }}
          title={panelTitle}
          footer={
            panel?.kind === 'settings' ? (
              <>
                <Button onClick={() => setPanel({ kind: 'skillTree' })}>
                  {t('openTree', { ns: 'skilltree' })}
                </Button>
                <Button
                  data-testid="teacher-open"
                  onClick={() => setPanel({ kind: 'teacherSummary' })}
                >
                  {t('title', { ns: 'teacher' })}
                </Button>
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
          {panel?.kind === 'skillTree' && (
            <SkillTreeScreen
              tree={skillTree}
              completed={derived.skills}
              focusNode={panel.focusNode}
              justLit={panel.focusNode}
              bestStars={Object.fromEntries(
                levels.flatMap((candidate) => {
                  const stars = derived.bestStars[candidate.id]
                  return stars === undefined
                    ? []
                    : candidate.skillNodes.map((node) => [node, stars])
                }),
              )}
              onReplay={replayNode}
              onBack={closePanel}
            />
          )}
          {panel?.kind === 'capstone' && <CapstoneScreen features={features} />}
          {panel?.kind === 'teacherSummary' && (
            <TeacherSummaryScreen
              summary={teacherSummary}
              topErrors={teacherErrors}
              onBack={() => setPanel({ kind: 'settings' })}
            />
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
              onOpenSkill={(node) => {
                void exitLocation(panel.level.location, transitionCtx())
                setPanel({ kind: 'skillTree', focusNode: node })
              }}
            />
          )}
        </PanelShell>
      </div>
    </>
  )
}

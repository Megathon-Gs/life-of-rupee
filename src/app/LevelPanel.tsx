import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DocumentInspectorConfigSchema,
  FormFillerConfigSchema,
  type InteractionEvent,
  type InteractionProps,
  type LevelCompletion,
  type LevelDef,
  type Locale,
} from '@/core/contracts'
import { skillTree } from '@/content/skillTree'
import { createLevelRunner, type LevelRunnerImpl, type RunnerView } from '@/level-runner'
import { interactions } from '@/ui/interactions'
import { ResultsScreen } from '@/ui/screens/Results'
import { DialogueSheet } from '@/ui/shell'
import { attemptSeed, levelNamespace } from './levels'
import { TEST_SEED } from './mode'
import { useGameStore } from './store'
import styles from './App.module.css'

type AnyInteraction = ComponentType<InteractionProps<unknown> & { stepId: string }>

const configSchemas: Record<string, { parse: (value: unknown) => unknown }> = {
  formFiller: FormFillerConfigSchema,
  documentInspector: DocumentInspectorConfigSchema,
}

const now = () => new Date().toISOString()

export interface LevelPanelProps {
  level: LevelDef
  levels: readonly LevelDef[]
  locale: Locale
  test: boolean
  /** Saves the finished attempt; results show once it resolves, so visuals follow the save. */
  onCompleted: () => Promise<void> | void
  onClose: () => void
}

/**
 * Drives one level inside the panel: dialogue for Hook and Consequence, the registered
 * interaction for Lesson, Decision and Transfer, then the results screen. Every runner
 * step is mirrored into the save so a reload resumes at the same step.
 */
export function LevelPanel({ level, levels, locale, test, onCompleted, onClose }: LevelPanelProps) {
  const { t } = useTranslation('app')
  const store = useGameStore()
  const runnerRef = useRef<LevelRunnerImpl | null>(null)
  // The step on screen; it changes only when the runner moves to another step.
  const [shown, setShown] = useState<RunnerView | null>(null)
  const [completion, setCompletion] = useState<LevelCompletion | null>(null)
  const callbacks = useRef({ onCompleted })
  useEffect(() => {
    callbacks.current = { onCompleted }
  })

  // Seed derived from the attempt count, so start and resume agree. The save's `inLevel` is
  // built from reducer actions, which carry no seed, so resume passes this as the fallback.
  const seedFor = () => {
    if (test) return TEST_SEED
    const { save } = store.getState()
    const tries = save.attempts.filter((a) => a.levelId === level.id).length
    return attemptSeed(save.learner.localId, level.id, tries)
  }

  /** Runs a runner call and mirrors accepted progress into the save as reducer actions. */
  const act = (call: (runner: LevelRunnerImpl) => boolean, event?: InteractionEvent): boolean => {
    const runner = runnerRef.current
    if (!runner) return false
    const before = runner.current()
    if (before.done) return false
    const accepted = call(runner)
    if (!accepted) return false
    const { dispatch } = store.getState()
    const after = runner.current()
    if (after.done) return true
    if (event) dispatch({ type: 'eventRecorded', event })
    for (let i = before.stepIndex; i < after.stepIndex; i += 1) dispatch({ type: 'stepAdvanced' })
    return true
  }

  /** The interaction finished its step: the runner moves on only on this signal. */
  const finishInteraction = () => {
    act((r) => r.complete())
    follow()
  }

  /** Shows the runner's current step, auto-completing Travel: the player is already here. */
  const follow = () => {
    const runner = runnerRef.current
    if (!runner) return
    if (runner.current().view?.type === 'travel') act((r) => r.arrive(level.location))
    setShown(runner.current())
  }

  const start = () => {
    const runner = createLevelRunner({ levels, newId: () => crypto.randomUUID(), now })
    runner.onComplete((done) => {
      store.getState().dispatch({ type: 'attemptCompleted', attempt: done.attempt })
      void (async () => {
        try {
          await callbacks.current.onCompleted()
        } finally {
          if (runnerRef.current === runner) setCompletion(done)
        }
      })()
    })
    runnerRef.current = runner
    const saved = store.getState().save.position.inLevel
    let resumed = false
    if (saved?.levelId === level.id) {
      try {
        runner.resume(saved, { seed: seedFor(), now })
        resumed = true
      } catch {
        // A snapshot from older content no longer fits; start the level again.
      }
    }
    if (!resumed) {
      runner.start(level, seedFor(), now)
      store.getState().dispatch({ type: 'levelStarted', levelId: level.id })
    }
    setCompletion(null)
    follow()
  }

  useEffect(() => {
    start()
    return () => {
      runnerRef.current = null
    }
    // Starts once per mount; the panel remounts for each visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!shown) return null

  if (shown.done) {
    if (!completion) return null
    return (
      <div data-testid="results">
        <ResultsScreen
          stars={completion.score.stars}
          reviewItems={completion.score.reviewItems}
          reviewNamespace={levelNamespace(level)}
          skillTree={skillTree}
          onRetry={start}
          onContinue={onClose}
        />
      </div>
    )
  }

  const view = shown.view!
  const speaker = t('dialogue.speaker')
  const advance = () => {
    act((r) => r.advance())
    follow()
  }

  let body
  switch (view.type) {
    case 'hook':
      body = (
        <div className={styles.dialogue}>
          <DialogueSheet
            speaker={speaker}
            lines={view.lineKeys.map((key) => t(key))}
            onContinue={advance}
          />
        </div>
      )
      break
    case 'consequence':
      body = (
        <div className={styles.dialogue}>
          <DialogueSheet
            speaker={speaker}
            lines={[...view.outcomeKeys, view.explanationKey].map((key) => t(key))}
            onContinue={advance}
          />
        </div>
      )
      break
    case 'travel':
      // Only reached if the level is somewhere else; the door cue never offers that.
      body = null
      break
    default: {
      const Interaction = interactions[view.interaction as keyof typeof interactions] as
        AnyInteraction | undefined
      const schema = configSchemas[view.interaction]
      const key = view.type === 'transfer' ? `${view.stepId}:${view.variantId}` : view.stepId
      body = Interaction ? (
        <Interaction
          key={`${shown.levelId}:${key}`}
          config={schema ? schema.parse(view.config) : view.config}
          locale={locale}
          stepId={view.stepId}
          onEvent={(event) => act((r) => r.dispatch(event), event)}
          onComplete={finishInteraction}
        />
      ) : (
        <p>{t('level.unsupported')}</p>
      )
    }
  }

  return (
    <div data-testid="level-step" data-step-type={view.type}>
      {body}
    </div>
  )
}

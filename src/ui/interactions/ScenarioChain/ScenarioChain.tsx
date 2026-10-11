import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import type { InteractionEvent, InteractionProps, ScenarioChainConfig } from '@/core/contracts'
import { Button } from '@/ui/shell'
import styles from './ScenarioChain.module.css'

/**
 * What a link hands to the next one, e.g. money left after a budget (paise). A link's `carry`
 * list names which of the numbers it reported via `onComplete({ carry })` reach the next link;
 * each lands in that link's config under the same name, replacing any configured value.
 */
export type CarryValues = Record<string, number>

type ChildProps = InteractionProps<unknown> & { stepId: string }

type Props = InteractionProps<ScenarioChainConfig> & {
  // shortcut: InteractionProps omits the runner step id; P0-20 binds the real step id.
  stepId?: string
  /**
   * Interaction components by id, looked up with `link.interaction`. Passed in rather than
   * imported so this file never depends on `interactions/index.ts` (P2-25 registers the chain
   * there and supplies the registry).
   */
  registry?: object
  /** Resume at this link; earlier links are not rendered, so their events are not replayed. */
  initialLink?: number
  /** Values the link before `initialLink` carried, restored on resume. */
  initialCarried?: CarryValues
  /** Called when a link finishes, with the link now showing and what was carried into it. */
  onLinkChange?: (link: number, carried: CarryValues) => void
}

/** Keeps only the outputs the finished link named in its `carry` list. */
function pickCarried(names: readonly string[] | undefined, outputs: unknown): CarryValues {
  const out: CarryValues = {}
  if (!names || typeof outputs !== 'object' || outputs === null) return out
  for (const name of names) {
    if (!Object.hasOwn(outputs, name)) continue
    const value = (outputs as Record<string, unknown>)[name]
    if (typeof value === 'number' && Number.isFinite(value)) out[name] = value
  }
  return out
}

export function ScenarioChain({
  config,
  locale,
  onEvent,
  onComplete,
  stepId = '',
  registry,
  initialLink = 0,
  initialCarried = {},
  onLinkChange,
}: Props) {
  const { t } = useTranslation('scenarioChain')
  const { t: tc } = useTranslation()
  const last = config.links.length - 1
  const [index, setIndex] = useState(() => Math.min(Math.max(Math.trunc(initialLink), 0), last))
  const [carried, setCarried] = useState<CarryValues>(initialCarried)
  const [sawWrong, setSawWrong] = useState(false)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const completed = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const advanced = useRef(false)

  // The focused control of the finished link unmounts, so keep keyboard users in the chain.
  useEffect(() => {
    if (advanced.current) heading.current?.focus()
  }, [index])

  const link = config.links[index]!
  const Child = lookup(registry, link.interaction)
  const linkConfig =
    typeof link.config === 'object' && link.config !== null
      ? { ...link.config, ...carried }
      : link.config

  const emit = (event: InteractionEvent) => {
    if (event.kind === 'choice' && !event.correct) setSawWrong(true)
    // Scoring matches the level step id exactly, so a child's events keep the chain's own id.
    onEvent({ ...event, stepId })
  }

  const finishLink = (result?: { carry?: CarryValues }) => {
    if (completed.current) return
    if (index === last) {
      completed.current = true
      onComplete()
      return
    }
    const next = pickCarried(link.carry, result?.carry)
    advanced.current = true
    setCarried(next)
    setIndex(index + 1)
    setSawWrong(false)
    setExplanationOpen(false)
    onLinkChange?.(index + 1, next)
  }

  const showHint = () => {
    const level = Math.min(hintLevel + 1, 2) as 1 | 2
    setHintLevel(level)
    onEvent({ kind: 'hint', stepId, level })
  }

  return (
    <section className={styles.chain} aria-label={tc(config.titleKey)}>
      <h3 ref={heading} tabIndex={-1}>
        {tc(config.titleKey)}
      </h3>
      <p>{tc(config.promptKey)}</p>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>

      <ol className={styles.progress} aria-label={t('progress.label')}>
        {config.links.map((_, i) => {
          const state = i < index ? 'done' : i === index ? 'current' : 'todo'
          return (
            <li
              key={i}
              className={styles[state]}
              aria-current={state === 'current' ? 'step' : undefined}
              data-state={state}
            >
              <span className={styles.pip} aria-hidden="true">
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span className={styles.pipText}>
                {t('progress.step', { n: i + 1, total: config.links.length })}
                {' — '}
                {t(`progress.${state}`)}
              </span>
            </li>
          )
        })}
      </ol>

      <div className={styles.link} data-testid="chain-link" data-link={index}>
        {Child ? (
          <Child
            key={index}
            config={linkConfig}
            locale={locale}
            stepId={stepId}
            onEvent={emit}
            onComplete={finishLink}
          />
        ) : (
          <p role="alert">{t('missing')}</p>
        )}
      </div>

      {sawWrong && (
        <div className={styles.feedback} role="status">
          <Button
            onClick={() => {
              onEvent({ kind: 'explanationOpened', stepId })
              setExplanationOpen(true)
            }}
          >
            {t('explanation.control')}
          </Button>
          {explanationOpen && <p>{tc(config.explanationKey)}</p>}
        </div>
      )}

      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{tc(config.hintKeys[hintLevel - 1]!)}</p>}
    </section>
  )
}

function lookup(registry: object | undefined, id: string): ComponentType<ChildProps> | undefined {
  if (!registry || !Object.hasOwn(registry, id)) return undefined
  const component = (registry as Record<string, unknown>)[id]
  return typeof component === 'function' ? (component as ComponentType<ChildProps>) : undefined
}

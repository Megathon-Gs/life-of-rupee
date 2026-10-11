import { useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { BudgetAllocatorConfig, InteractionProps } from '@/core/contracts'
import { formatINR } from '@/core/finance/money'
import { Button } from '@/ui/shell'
import {
  JARS,
  addToJar,
  asPaise,
  initialAllocation,
  judge,
  remaining,
  removeFromJar,
  type Jar,
} from './allocation'
import styles from './BudgetAllocator.module.css'

// shortcut: InteractionProps omits the runner step id; P0-20 binds the real step id.
type Props = InteractionProps<BudgetAllocatorConfig> & { stepId?: string }

export function BudgetAllocator({ config, locale, onEvent, onComplete, stepId = '' }: Props) {
  const { t } = useTranslation('budgetAllocator')
  const { t: tc } = useTranslation()
  const commitment = config.recurringCommitmentPaise ?? 0
  const requiredNeeds = (config.essentialsPaise ?? 0) + commitment
  const [alloc, setAlloc] = useState(() => initialAllocation(config.availablePaise, commitment))
  const [verdict, setVerdict] = useState<ReturnType<typeof judge> | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const completed = useRef(false)

  const money = (n: number) => formatINR(asPaise(n), locale)
  const left = remaining(config.availablePaise, alloc)
  const jarName = (jar: Jar) => t(`jar.${jar}`)

  const change = (next: typeof alloc) => {
    setAlloc(next)
    setVerdict(null)
    setExplanationOpen(false)
  }
  const add = (jar: Jar) => change(addToJar(config.availablePaise, alloc, jar))
  const remove = (jar: Jar) => change(removeFromJar(alloc, jar, commitment))

  const onDrop = (jar: Jar) => (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer.getData('text/plain') === 'money') add(jar)
  }

  const check = () => {
    const result = judge(config.availablePaise, alloc, requiredNeeds)
    setVerdict(result)
    if (result === 'unallocated') return
    if (result === 'ok') {
      onEvent({ kind: 'choice', stepId, correct: true })
      if (!completed.current) {
        completed.current = true
        onComplete()
      }
      return
    }
    onEvent({
      kind: 'choice',
      stepId,
      correct: false,
      error: result === 'noEssentials' ? config.errors.noEssentials : config.errors.noSavings,
      severity: result === 'noEssentials' ? 'major' : 'minor',
    })
  }

  const showHint = () => {
    const level = Math.min(hintLevel + 1, 2) as 1 | 2
    setHintLevel(level)
    onEvent({ kind: 'hint', stepId, level })
  }

  return (
    <section className={styles.allocator} aria-label={tc(config.titleKey)}>
      <h3>{tc(config.titleKey)}</h3>
      <p>{tc(config.promptKey)}</p>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>

      <dl className={styles.figures}>
        <div>
          <dt>{t('available')}</dt>
          <dd>{money(config.availablePaise)}</dd>
        </div>
        <div>
          <dt>{t('remaining')}</dt>
          <dd data-testid="remaining" aria-live="polite">
            {money(left)}
          </dd>
        </div>
        {commitment > 0 && (
          <div>
            <dt>{t('commitment')}</dt>
            <dd>{money(commitment)}</dd>
          </div>
        )}
      </dl>

      <div
        className={styles.pool}
        draggable={left > 0}
        onDragStart={(event) => event.dataTransfer.setData('text/plain', 'money')}
        data-testid="money-pool"
      >
        {t('dragHint', { amount: money(Math.min(left, 50_000)) })}
      </div>

      <ul className={styles.jars}>
        {JARS.map((jar) => {
          const locked = jar === 'needs' ? commitment : 0
          return (
            <li
              key={jar}
              className={styles.jar}
              data-testid={`jar-${jar}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop(jar)}
            >
              <h4>{jarName(jar)}</h4>
              <p className={styles.amount} data-testid={`amount-${jar}`}>
                {money(alloc[jar])}
              </p>
              {locked > 0 && (
                <p className={styles.locked}>{t('locked', { amount: money(locked) })}</p>
              )}
              <div className={styles.actions}>
                <Button
                  aria-label={t('add', { jar: jarName(jar) })}
                  disabled={left <= 0}
                  onClick={() => add(jar)}
                >
                  +
                </Button>
                <Button
                  aria-label={t('remove', { jar: jarName(jar) })}
                  disabled={alloc[jar] <= locked}
                  onClick={() => remove(jar)}
                >
                  −
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <Button variant="primary" onClick={check}>
        {t('check')}
      </Button>

      {verdict && verdict !== 'ok' && (
        <div className={styles.feedback} role="status">
          <p>{t(`feedback.${verdict}`)}</p>
          {verdict !== 'unallocated' && (
            <Button
              onClick={() => {
                onEvent({ kind: 'explanationOpened', stepId })
                setExplanationOpen(true)
              }}
            >
              {t('explanation.control')}
            </Button>
          )}
          {explanationOpen && <p>{tc(config.explanationKey)}</p>}
        </div>
      )}
      {verdict === 'ok' && (
        <p className={styles.feedback} role="status">
          {t('feedback.ok')}
        </p>
      )}

      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{tc(config.hintKeys[hintLevel - 1]!)}</p>}
    </section>
  )
}

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DocumentInspectorConfig, InteractionProps } from '@/core/contracts'
import { Button } from '@/ui/shell'
import styles from './DocumentInspector.module.css'

// shortcut: InteractionProps omits the runner step id; P0-20 binds the real step id.
type Props = InteractionProps<DocumentInspectorConfig> & { stepId?: string }

export function DocumentInspector({ config, onEvent, onComplete, stepId = '' }: Props) {
  const { t } = useTranslation('interactions')
  const [selected, setSelected] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const completed = useRef(false)

  const pick = (field: DocumentInspectorConfig['fields'][number]) => {
    const correct = field.isAnswer
    onEvent({
      kind: 'choice',
      stepId,
      correct,
      ...(!correct && field.error ? { error: field.error } : {}),
    })
    setSelected(field.id)
    setWrong(correct ? null : field.id)
    setExplanationOpen(false)
    if (correct && !completed.current) {
      completed.current = true
      onComplete()
    }
  }

  const showHint = () => {
    const level = Math.min(hintLevel + 1, 2) as 1 | 2
    setHintLevel(level)
    onEvent({ kind: 'hint', stepId, level })
  }

  return (
    <section className={styles.document} aria-label={t(config.titleKey)}>
      <h3>{t(config.titleKey)}</h3>
      <p>{t(config.promptKey)}</p>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>
      <div className={styles.regions}>
        {config.fields.map((field) => (
          <article className={styles.region} key={field.id}>
            <p>
              <strong>{t(field.labelKey)}</strong>
            </p>
            <p>{t(field.valueKey)}</p>
            <Button aria-pressed={selected === field.id} onClick={() => pick(field)}>
              {t('document.inspect', { label: t(field.labelKey) })}
            </Button>
            {wrong === field.id && (
              <div className={styles.feedback} role="status">
                <p>{t('feedback')}</p>
                <Button
                  onClick={() => {
                    onEvent({ kind: 'explanationOpened', stepId })
                    setExplanationOpen(true)
                  }}
                >
                  {t('explanation.control')}
                </Button>
                {explanationOpen && <p>{t('explanation.text')}</p>}
              </div>
            )}
          </article>
        ))}
      </div>
      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{t(`hint.level${hintLevel}`)}</p>}
    </section>
  )
}

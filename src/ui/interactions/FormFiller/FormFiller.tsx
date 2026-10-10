import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FormFillerConfig, InteractionProps } from '@/core/contracts'
import { Button } from '@/ui/shell'
import styles from './FormFiller.module.css'

// shortcut: InteractionProps omits the runner step id; P0-20 binds the real step id.
type Props = InteractionProps<FormFillerConfig> & { stepId?: string }

export function FormFiller({ config, onEvent, onComplete, stepId = '' }: Props) {
  const { t } = useTranslation('interactions')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [wrong, setWrong] = useState<string | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const completed = useRef(false)

  const pick = (fieldId: string, optionId: string, correctOptionId: string, error?: string) => {
    const correct = optionId === correctOptionId
    onEvent({ kind: 'choice', stepId, correct, ...(!correct && error ? { error } : {}) })
    setWrong(correct ? null : fieldId)
    setExplanationOpen(false)
    if (!correct) return
    const next = { ...answers, [fieldId]: optionId }
    setAnswers(next)
    if (
      !completed.current &&
      config.fields.every((field) => next[field.id] === field.correctOptionId)
    ) {
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
    <section className={styles.form} aria-label={t(config.titleKey)}>
      <h3>{t(config.titleKey)}</h3>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>
      {config.fields.map((field) => (
        <fieldset className={styles.field} key={field.id}>
          <legend>{t(field.labelKey)}</legend>
          <div className={styles.options}>
            {field.options.map((option) => (
              <Button
                key={option.id}
                aria-pressed={answers[field.id] === option.id}
                onClick={() => pick(field.id, option.id, field.correctOptionId, field.error)}
              >
                {t(option.labelKey)}
              </Button>
            ))}
          </div>
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
        </fieldset>
      ))}
      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{t(`hint.level${hintLevel}`)}</p>}
    </section>
  )
}

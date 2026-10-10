import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InteractionProps, MessageTriageConfig } from '@/core/contracts'
import { Button } from '@/ui/shell'
import styles from './MessageTriage.module.css'

type Props = InteractionProps<MessageTriageConfig> & { stepId?: string }

export function MessageTriage({ config, onEvent, onComplete, stepId = '' }: Props) {
  const { t } = useTranslation('interactions')
  const [index, setIndex] = useState(0)
  const [classification, setClassification] = useState<'safe' | 'fraud' | null>(null)
  const [selectedSigns, setSelectedSigns] = useState<string[]>([])
  const [missedSigns, setMissedSigns] = useState<string[]>([])
  const [hintLevel, setHintLevel] = useState(0)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const completed = useRef(false)
  const message = config.messages[index]

  const classify = (answer: 'safe' | 'fraud') => {
    setClassification(answer)
    const correct =
      answer === message.correctClassification &&
      message.requiredWarningSignIds.every((id) => selectedSigns.includes(id)) &&
      selectedSigns.every((id) => message.requiredWarningSignIds.includes(id))
    onEvent({
      kind: 'choice',
      stepId,
      correct,
      ...(!correct ? { error: message.error, severity: message.severity } : {}),
    })
    const missing = message.requiredWarningSignIds.filter((id) => !selectedSigns.includes(id))
    setMissedSigns(
      answer !== message.correctClassification || missing.length > 0
        ? missing.length
          ? missing
          : message.warningSigns.map((sign) => sign.id)
        : [],
    )
    if (correct) {
      if (index === config.messages.length - 1 && !completed.current) {
        completed.current = true
        onComplete()
      } else {
        setIndex(index + 1)
      }
      setSelectedSigns([])
      setClassification(null)
    }
  }

  const showHint = () => {
    const level = Math.min(hintLevel + 1, 2) as 1 | 2
    setHintLevel(level)
    onEvent({ kind: 'hint', stepId, level })
  }

  return (
    <section className={styles.triage} aria-label={t(config.titleKey)}>
      <h3>{t(config.titleKey)}</h3>
      <p>{t(config.promptKey)}</p>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>
      <article className={styles.message} aria-label={t(message.senderKey)}>
        <p>
          <strong>{t(message.senderKey)}</strong> <span>({message.channel})</span>
        </p>
        <p>{t(message.bodyKey)}</p>
        <fieldset>
          <legend>{t('triage.warningSigns')}</legend>
          {message.warningSigns.map((sign) => (
            <label key={sign.id} className={styles.sign}>
              <input
                type="checkbox"
                checked={selectedSigns.includes(sign.id)}
                onChange={() =>
                  setSelectedSigns((current) =>
                    current.includes(sign.id)
                      ? current.filter((id) => id !== sign.id)
                      : [...current, sign.id],
                  )
                }
              />
              {t(sign.labelKey)}
            </label>
          ))}
        </fieldset>
        {missedSigns.length > 0 && (
          <div className={styles.feedback} role="status">
            <p>{t('triage.missedSigns')}</p>
            <ul>
              {missedSigns.map((id) => {
                const sign = message.warningSigns.find((item) => item.id === id)
                return sign && <li key={id}>{t(sign.labelKey)}</li>
              })}
            </ul>
            <Button
              onClick={() => {
                onEvent({ kind: 'explanationOpened', stepId })
                setExplanationOpen(true)
              }}
            >
              {t('explanation.control')}
            </Button>
            {explanationOpen && <p>{t(config.explanationKey)}</p>}
            <Button
              onClick={() => {
                setMissedSigns([])
                setClassification(null)
              }}
            >
              {t('triage.tryAgain')}
            </Button>
          </div>
        )}
        <div className={styles.actions}>
          <Button aria-pressed={classification === 'safe'} onClick={() => classify('safe')}>
            {t('triage.safe')}
          </Button>
          <Button aria-pressed={classification === 'fraud'} onClick={() => classify('fraud')}>
            {t('triage.fraud')}
          </Button>
        </div>
      </article>
      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{t(config.hintKeys[hintLevel - 1])}</p>}
      <p aria-live="polite">
        {index + 1} / {config.messages.length}
      </p>
    </section>
  )
}

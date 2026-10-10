import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InteractionProps, UpiPaymentConfig } from '@/core/contracts'
import { Button } from '@/ui/shell'
import styles from './UpiPayment.module.css'

type Props = InteractionProps<UpiPaymentConfig> & { stepId?: string }

export function UpiPayment({ config, onEvent, onComplete, stepId = '' }: Props) {
  const { t } = useTranslation('interactions')
  const [pinOpen, setPinOpen] = useState(false)
  const [pinLength, setPinLength] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const completed = useRef(false)

  const choose = (choice: UpiPaymentConfig['choices'][number]) => {
    if (choice.action === 'enterPin') {
      setPinLength(0)
      setPinOpen(true)
      setWrong(false)
      return
    }
    submit(choice)
  }

  const submit = (choice: UpiPaymentConfig['choices'][number]) => {
    const correct = choice.id === config.correctChoiceId
    onEvent({
      kind: 'choice',
      stepId,
      correct,
      ...(!correct && choice.error ? { error: choice.error } : {}),
      ...(!correct && choice.severity ? { severity: choice.severity } : {}),
    })
    setPinOpen(false)
    setPinLength(0)
    setWrong(!correct)
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

  const pendingChoice = config.choices.find((choice) => choice.action === 'enterPin')

  return (
    <section className={styles.payment} aria-label={t(config.titleKey)}>
      <h3>{t(config.titleKey)}</h3>
      <p>{t(config.promptKey)}</p>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>
      <div className={styles.phone}>
        <dl className={styles.details}>
          <div>
            <dt>Payee</dt>
            <dd>{t(config.payeeNameKey)}</dd>
          </div>
          <div>
            <dt>UPI handle</dt>
            <dd>{t(config.payeeHandleKey)}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>₹{(config.amountPaise / 100).toFixed(2)}</dd>
          </div>
          <div>
            <dt>Note</dt>
            <dd>{t(config.noteKey)}</dd>
          </div>
        </dl>
        {!pinOpen && (
          <div className={styles.actions}>
            {config.choices.map((choice) => (
              <Button key={choice.id} onClick={() => choose(choice)}>
                {t(choice.labelKey)}
              </Button>
            ))}
          </div>
        )}
        {pinOpen && pendingChoice && (
          <div className={styles.keypad} aria-label="Mock PIN keypad">
            <p aria-live="polite">
              Mock PIN: {Array.from({ length: pinLength }, () => '•').join('')}
            </p>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
              <Button
                key={digit}
                aria-label={`Enter mock digit ${digit}`}
                onClick={() => setPinLength((length) => Math.min(length + 1, 4))}
              >
                {digit}
              </Button>
            ))}
            <Button disabled={pinLength !== 4} onClick={() => submit(pendingChoice)}>
              Confirm mock PIN
            </Button>
            <Button
              onClick={() => {
                setPinOpen(false)
                setPinLength(0)
              }}
            >
              Cancel
            </Button>
          </div>
        )}
        {wrong && (
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
            {explanationOpen && <p>{t(config.explanationKey)}</p>}
          </div>
        )}
      </div>
      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{t(config.hintKeys[hintLevel - 1])}</p>}
    </section>
  )
}

import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import styles from './DialogueSheet.module.css'

/** A beat of conversation never shows more than this many lines. */
export const MAX_DIALOGUE_LINES = 3

export interface DialogueSheetProps {
  /** Speaker name, already translated. */
  speaker: string
  /** Up to three lines, already translated; extra lines are dropped. */
  lines: string[]
  /** True on the last beat: the primary action reads "Done". */
  isLast?: boolean
  onContinue: () => void
  /** Omit to hide Skip (e.g. a line the player must read). */
  onSkip?: () => void
}

/**
 * NPC dialogue in a sheet pinned to the bottom of the world band. Non-modal:
 * the street stays visible above it, and new lines are announced politely.
 */
export function DialogueSheet({ speaker, lines, isLast = false, onContinue, onSkip }: DialogueSheetProps) {
  const { t } = useTranslation('ui')
  if (import.meta.env.DEV && lines.length > MAX_DIALOGUE_LINES) {
    console.warn(`DialogueSheet: ${lines.length} lines given, showing the first ${MAX_DIALOGUE_LINES}.`)
  }
  return (
    <section className={styles.sheet} aria-label={t('dialogue.label', { speaker })}>
      <p className={styles.speaker} aria-hidden="true">
        {speaker}
      </p>
      <div className={styles.lines} aria-live="polite">
        {lines.slice(0, MAX_DIALOGUE_LINES).map((line, i) => (
          <p key={i} className={styles.line}>
            {line}
          </p>
        ))}
      </div>
      <div className={styles.actions}>
        {onSkip && (
          <Button variant="quiet" onClick={onSkip}>
            {t('dialogue.skip')}
          </Button>
        )}
        <Button variant="primary" onClick={onContinue} className={styles.continue}>
          {isLast ? t('dialogue.done') : t('dialogue.continue')}
        </Button>
      </div>
    </section>
  )
}

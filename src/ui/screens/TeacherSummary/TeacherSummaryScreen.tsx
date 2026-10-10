import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { TeacherSummary } from '@/core/contracts'
import { Button } from '../../shell/Button'
import styles from './TeacherSummaryScreen.module.css'

/** One error category and how often it came up, most frequent first. */
export interface TeacherError {
  code: string
  count: number
}

export interface TeacherSummaryScreenProps {
  summary: TeacherSummary
  /** Top error categories in plain words; no attempt or level ids. */
  topErrors: TeacherError[]
  onBack?: () => void
}

/**
 * "Show my teacher": display-only learning totals a caregiver can read at arm's
 * length. It renders a `TeacherSummary` (stars per branch, levels completed)
 * plus plain-word error categories. Nothing is sent or stored, and no learner,
 * profile, sync, attempt or level identifier is shown.
 */
export function TeacherSummaryScreen({ summary, topErrors, onBack }: TeacherSummaryScreenProps) {
  const { t } = useTranslation('teacher')
  const titleId = useId()
  const starsId = useId()
  const errorsId = useId()

  return (
    <section className={styles.screen} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {t('title')}
        </h2>
        <p className={styles.note}>{t('note')}</p>
      </header>

      <p className={styles.levels}>{t('levelsCompleted', { count: summary.levelsCompleted })}</p>

      <section className={styles.block} aria-labelledby={starsId}>
        <h3 id={starsId} className={styles.blockTitle}>
          {t('starsHeading')}
        </h3>
        <ul className={styles.rows}>
          {summary.starsByBranch.map((branch) => (
            <li key={branch.labelKey} className={styles.row}>
              <span className={styles.label}>{t(branch.labelKey, { ns: 'world' })}</span>
              <span className={styles.value}>{t('stars', { count: branch.stars })}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby={errorsId}>
        <h3 id={errorsId} className={styles.blockTitle}>
          {t('errorsHeading')}
        </h3>
        {topErrors.length === 0 ? (
          <p className={styles.empty}>{t('errorsEmpty')}</p>
        ) : (
          <ul className={styles.rows}>
            {topErrors.map((error) => (
              <li key={error.code} className={styles.row}>
                <span className={styles.label}>
                  {t(`error.${error.code}`, { defaultValue: t('error.unknown') })}
                </span>
                <span className={styles.value}>{t('errorCount', { count: error.count })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {onBack && (
        <div className={styles.footer}>
          <Button variant="primary" onClick={onBack}>
            {t('back')}
          </Button>
        </div>
      )}
    </section>
  )
}

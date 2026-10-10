import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './DocumentPanelFixture.module.css'

/**
 * Gallery stand-in for a financial panel body (the DocumentInspector surface,
 * owned by src/ui/interactions). Shows how a fictional document sits inside
 * PanelShell; it has no scoring or game logic.
 */
export function DocumentPanelFixture() {
  const { t } = useTranslation('l02')
  const [picked, setPicked] = useState<string | null>(null)
  const fields = [
    { id: 'passport', label: t('lesson.documentLabel'), value: t('lesson.documentValue') },
    { id: 'library', label: t('lesson.schoolCardLabel'), value: t('lesson.schoolCardValue') },
  ]
  return (
    <div className={styles.inspector}>
      <p className={styles.prompt}>{t('lesson.prompt')}</p>
      <div className={styles.document} role="group" aria-label={t('lesson.title')}>
        {fields.map(field => (
          <button
            key={field.id}
            type="button"
            className={styles.field}
            aria-pressed={picked === field.id}
            onClick={() => setPicked(field.id)}
          >
            <span className={styles.fieldLabel}>{field.label}</span>
            <span className={styles.fieldValue}>{field.value}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { PixelIcon } from './PixelIcon'
import styles from './Hud.module.css'

export interface HudProps {
  /** Chapter name, already translated (e.g. "Chapter 1 · Getting started"). */
  chapter: string
  /** Current location name, already translated. */
  location: string
  /** 1-based position along the street and the number of places. */
  progress?: { current: number; total: number }
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  onOpenSettings: () => void
  /** Opens the skill tree; the button only shows when this is set. */
  onOpenSkillTree?: () => void
  /** Optional standing reminder under the location name (e.g. an active loan instalment). */
  status?: string
}

/**
 * Town overlay: a sign plate (chapter, location), settings, and Previous/Next as
 * the button alternative to swiping. The root lets taps through to the world;
 * only its controls catch pointer events.
 */
export function Hud({
  chapter,
  location,
  progress,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onOpenSettings,
  onOpenSkillTree,
  status,
}: HudProps) {
  const { t } = useTranslation('ui')
  return (
    <div className={styles.hud}>
      <header className={styles.top} aria-label={t('hud.label')}>
        <div className={styles.sign}>
          <p className={styles.chapter}>{chapter}</p>
          <h2 className={styles.location}>{location}</h2>
          {status && (
            <p className={styles.status} data-testid="hud-status">
              {status}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          {onOpenSkillTree && (
            <Button onClick={onOpenSkillTree} data-testid="skill-tree-open">
              {t('hud.skillTree')}
            </Button>
          )}
          <Button
            iconOnly
            aria-label={t('hud.settings')}
            onClick={onOpenSettings}
            className={styles.settings}
          >
            <PixelIcon name="settings" scale={3} />
          </Button>
        </div>
      </header>
      <nav className={styles.nav} aria-label={t('hud.navLabel')}>
        <Button onClick={onPrevious} disabled={!canGoPrevious} className={styles.step}>
          <PixelIcon name="previous" scale={2} />
          <span>{t('hud.previous')}</span>
        </Button>
        {progress && (
          <p className={styles.progress}>
            <span className="visually-hidden">
              {t('hud.progress', { current: progress.current, total: progress.total })}
            </span>
            <span className={styles.dots} aria-hidden="true">
              {Array.from({ length: progress.total }, (_, i) => (
                <span key={i} className={i + 1 === progress.current ? styles.dotHere : styles.dot} />
              ))}
            </span>
          </p>
        )}
        <Button variant="primary" onClick={onNext} disabled={!canGoNext} className={styles.step}>
          <span>{t('hud.next')}</span>
          <PixelIcon name="next" scale={2} />
        </Button>
      </nav>
    </div>
  )
}

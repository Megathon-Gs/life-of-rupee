import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { compound } from '@/core/finance/interest'
import { formatINR, rupees } from '@/core/finance/money'
import { approvedEducationalLinks, type ApprovedLink } from '@/content/capstone'
import type { AppConfig } from '@/core/contracts'
import styles from './CapstoneScreen.module.css'

export interface CapstoneScreenProps {
  features: AppConfig['features']
  /** Approved external learning material; defaults to the (empty until approved) content list. */
  links?: readonly ApprovedLink[]
}

const principal = rupees(1000)
const annualRatePct = 5

export function CapstoneScreen({ features, links = approvedEducationalLinks }: CapstoneScreenProps) {
  const { t, i18n } = useTranslation('capstone')
  const yearsId = useId()
  const [years, setYears] = useState(10)
  const [diversification, setDiversification] = useState<'one' | 'spread' | null>(null)
  const [horizon, setHorizon] = useState<'short' | 'long'>('short')

  if (!features.capstone) return null

  return (
    <section className={styles.screen} aria-labelledby="capstone-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('eyebrow')}</p>
        <h2 id="capstone-title" className={styles.title}>{t('title')}</h2>
        <p>{t('intro')}</p>
      </header>

      <section className={styles.card} aria-labelledby="compound-title">
        <h3 id="compound-title">{t('compound.title')}</h3>
        <p>{t('compound.description')}</p>
        <label className={styles.control} htmlFor={yearsId}>
          <span>{t('compound.years', { years })}</span>
          <input
            id={yearsId}
            type="range"
            min="1"
            max="20"
            value={years}
            onChange={event => setYears(Number(event.currentTarget.value))}
          />
        </label>
        <p className={styles.result} aria-live="polite">
          {t('compound.result', {
            years,
            amount: formatINR(compound(principal, annualRatePct, 1, years), i18n.language),
          })}
        </p>
        <p className={styles.note}>{t('compound.assumption', { rate: annualRatePct })}</p>
      </section>

      <section className={styles.card} aria-labelledby="diversification-title">
        <h3 id="diversification-title">{t('diversification.title')}</h3>
        <p>{t('diversification.question')}</p>
        <div className={styles.choices}>
          {(['one', 'spread'] as const).map(choice => (
            <button
              key={choice}
              type="button"
              aria-pressed={diversification === choice}
              onClick={() => setDiversification(choice)}
            >
              {t(`diversification.${choice}`)}
            </button>
          ))}
        </div>
        {diversification && <p aria-live="polite">{t(`diversification.feedback.${diversification}`)}</p>}
      </section>

      <section className={styles.card} aria-labelledby="horizon-title">
        <h3 id="horizon-title">{t('horizon.title')}</h3>
        <p>{t('horizon.question')}</p>
        <div className={styles.choices}>
          {(['short', 'long'] as const).map(choice => (
            <button
              key={choice}
              type="button"
              aria-pressed={horizon === choice}
              onClick={() => setHorizon(choice)}
            >
              {t(`horizon.${choice}`)}
            </button>
          ))}
        </div>
        <p aria-live="polite">{t(`horizon.feedback.${horizon}`)}</p>
      </section>

      {links.length > 0 && (
        <nav className={styles.links} aria-label={t('links.title')}>
          <h3>{t('links.title')}</h3>
          {links.map(link => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
              {t(link.labelKey)} <span>{t('links.opensOutside')}</span>
            </a>
          ))}
        </nav>
      )}
      <p className={styles.footer}>{t('footer')}</p>
    </section>
  )
}

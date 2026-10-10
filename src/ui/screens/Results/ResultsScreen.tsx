import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReviewItem, SkillTreeDef, Stars } from '@/core/contracts'
import { STAR_REVEAL_MS } from '../../tokens'
import { Button } from '../../shell/Button'
import { PixelStar } from '../../shell/PixelStar'
import { useReducedMotion } from '../../shell/UiRoot'
import styles from './ResultsScreen.module.css'

const MAX_STARS = 3

type ReviewPart = { label: string; text: string }

/**
 * Splits an approved review string ("Your choice: … Safer choice: … Why it
 * matters: …") into labelled parts so phones get rows, not one dense block.
 * Labels are whatever precedes a colon at the start of a sentence, so it works
 * for English and Telugu alike; text without that shape stays one paragraph.
 */
export function parseReview(text: string): ReviewPart[] {
  const marker = /(?:^|(?<=[.!?])\s+)([^.:!?;]{2,32}):\s+/g
  const hits = [...text.matchAll(marker)]
  if (hits.length < 2) return [{ label: '', text }]
  return hits.map((hit, i) => {
    const start = hit.index + hit[0].length
    const end = i + 1 < hits.length ? hits[i + 1]!.index : text.length
    const body = text.slice(start, end).trim()
    return { label: hit[1]!.trim(), text: body.charAt(0).toUpperCase() + body.slice(1) }
  })
}

export interface ResultsScreenProps {
  stars: Stars
  reviewItems: ReviewItem[]
  /** i18n namespace holding each item's `reviewKey` (the level's namespace, e.g. "l02"). */
  reviewNamespace: string
  /** Used to name the skill each review item points to. */
  skillTree: SkillTreeDef
  onRetry: () => void
  onContinue: () => void
}

/**
 * End-of-level results: stars reveal one by one (all at once with reduced
 * motion), lost stars stay visible in coral, and "What changed my result?"
 * explains each deduction. Retry is the primary action until all three stars.
 */
export function ResultsScreen({
  stars,
  reviewItems,
  reviewNamespace,
  skillTree,
  onRetry,
  onContinue,
}: ResultsScreenProps) {
  const { t } = useTranslation('ui')
  const reducedMotion = useReducedMotion()
  const titleId = useId()
  const reviewId = useId()
  const [revealed, setRevealed] = useState(reducedMotion ? MAX_STARS : 0)

  useEffect(() => {
    if (reducedMotion) {
      setRevealed(MAX_STARS)
      return
    }
    setRevealed(0)
    let count = 0
    const timer = setInterval(() => {
      count += 1
      setRevealed(count)
      if (count >= MAX_STARS) clearInterval(timer)
    }, STAR_REVEAL_MS)
    return () => clearInterval(timer)
  }, [reducedMotion, stars])

  const lost = MAX_STARS - stars
  const perfect = stars === MAX_STARS
  const skillLabel = (id: string) => {
    const node = skillTree.nodes.find(n => n.id === id)
    return node ? t(node.labelKey, { ns: 'world' }) : id
  }

  const retry = (
    <Button variant={perfect ? 'secondary' : 'primary'} onClick={onRetry} key="retry">
      {t('results.retry')}
    </Button>
  )
  const back = (
    <Button variant={perfect ? 'primary' : 'secondary'} onClick={onContinue} key="continue">
      {t('results.continue')}
    </Button>
  )

  return (
    <section className={styles.screen} aria-labelledby={titleId} data-reduced-motion={reducedMotion}>
      <div className={styles.sheet}>
        <div className={styles.score}>
          <h2 id={titleId} className={styles.title}>
            {stars > 0 ? t('results.titlePass') : t('results.titleRetry')}
          </h2>
          <ol className={styles.stars} aria-hidden="true">
            {Array.from({ length: MAX_STARS }, (_, i) => {
              const state = i < stars ? 'earned' : 'lost'
              return (
                <li
                  key={i}
                  className={styles.star}
                  data-revealed={i < revealed}
                  data-state={state}
                  data-testid="result-star"
                >
                  <PixelStar state={state} scale={6} />
                </li>
              )
            })}
          </ol>
          <p className={styles.summary}>{t('results.starsSummary', { stars })}</p>
          <p className={styles.loss}>{lost > 0 ? t('results.starsLost', { lost }) : t('results.allStars')}</p>
        </div>

        <div className={styles.review}>
          <h3 id={reviewId} className={styles.reviewTitle}>
            {t('results.reviewTitle')}
          </h3>
          {reviewItems.length === 0 ? (
            <p className={styles.empty}>{t('results.reviewEmpty')}</p>
          ) : (
            <ul className={styles.items}>
              {reviewItems.map(item => (
                <li key={item.error} className={styles.item} data-severity={item.severity}>
                  <p className={styles.severity}>{t(`results.severity.${item.severity}`)}</p>
                  <dl className={styles.parts}>
                    {parseReview(t(item.reviewKey, { ns: reviewNamespace })).map(part => (
                      <div key={part.label + part.text} className={styles.part}>
                        {part.label && <dt className={styles.partLabel}>{part.label}</dt>}
                        <dd className={styles.partText}>{part.text}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className={styles.skill}>{t('results.skillPointer', { skill: skillLabel(item.skillNode) })}</p>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.note}>{t('results.firstAttemptKept')}</p>
        </div>

        <div className={styles.actions}>
          <div className={styles.buttons}>{perfect ? [back, retry] : [retry, back]}</div>
        </div>
      </div>
    </section>
  )
}

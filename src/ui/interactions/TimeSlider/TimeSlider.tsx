import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InteractionProps, TimeSliderConfig } from '@/core/contracts'
import { priceAfter } from '@/core/finance/inflation'
import { compound } from '@/core/finance/interest'
import { formatINR, roundPaise, type Paise } from '@/core/finance/money'
import { Button, useReducedMotion } from '@/ui/shell'
import styles from './TimeSlider.module.css'

// shortcut: InteractionProps omits the runner step id; P0-20 binds the real step id.
type Props = InteractionProps<TimeSliderConfig> & { stepId?: string }

const DEFAULT_RANGE_SPREAD_PCT = 2

export function TimeSlider({ config, locale, onEvent, onComplete, stepId = '' }: Props) {
  const { t } = useTranslation('timeSlider')
  const reduced = useReducedMotion()
  const [years, setYears] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const completed = useRef(false)

  const { annualRatePct: rate, annualInflationPct: inflation, maxYears } = config
  const spread = config.rangeSpreadPct ?? DEFAULT_RANGE_SPREAD_PCT
  const initial = config.initialAmountPaise as Paise
  const money = (paise: Paise) => formatINR(paise, locale)
  const hasRate = rate !== undefined
  const hasInflation = inflation !== undefined
  const mode = hasRate && hasInflation ? 'range' : hasRate ? 'savings' : 'basket'

  const grown = (y: number, pct = rate ?? 0) => compound(initial, pct, 1, y)
  const base = (y: number): Paise =>
    mode === 'basket' ? priceAfter(initial, inflation ?? 0, y) : grown(y)
  const low = (y: number) => grown(y, Math.max(0, (rate ?? 0) - spread))
  const high = (y: number) => grown(y, (rate ?? 0) + spread)
  const top = mode === 'range' ? high(maxYears) : base(maxYears)
  const inTodaysMoney = (amount: Paise, y: number) =>
    roundPaise(amount / (1 + (inflation ?? 0) / 100) ** y) as Paise

  const bars = Array.from({ length: maxYears + 1 }, (_, y) => y)
  const pct = (value: number) => (top > 0 && value > 0 ? Math.max(2, (value / top) * 100) : 0)

  const step = (delta: number) => setYears((y) => Math.min(maxYears, Math.max(0, y + delta)))

  // Without configured `choices` the pair is derived: with inflation, "bigger number" vs "buys
  // more"; otherwise "stays put" vs "grows".
  const set = hasInflation ? 'inflation' : 'plain'
  const options = config.choices
    ? config.choices.map((choice) => ({
        id: choice.id,
        label: t(choice.labelKey),
        correct: choice.id === config.correctChoiceId,
        error: choice.error ?? config.error,
        severity: choice.severity ?? ('major' as const),
      }))
    : [
        {
          id: 'wrong',
          label: t(`choices.${set}.wrong`),
          correct: false,
          error: config.error,
          severity: 'major' as const,
        },
        {
          id: 'right',
          label: t(`choices.${set}.right`),
          correct: true,
          error: config.error,
          severity: 'major' as const,
        },
      ]

  const answer = (option: (typeof options)[number]) => {
    const { correct } = option
    onEvent({
      kind: 'choice',
      stepId,
      correct,
      ...(!correct ? { error: option.error, severity: option.severity } : {}),
    })
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

  const summary =
    mode === 'range'
      ? t('line.range', { years, low: money(low(years)), high: money(high(years)) })
      : mode === 'basket'
        ? t('line.basket', { years, from: money(initial), to: money(base(years)) })
        : t('line.savings', { years, from: money(initial), to: money(base(years)) })

  return (
    <section className={styles.slider} aria-label={t(config.titleKey)}>
      <h3>{t(config.titleKey)}</h3>
      <p>{t(config.promptKey)}</p>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>

      <ul className={styles.assumptions}>
        {hasRate && <li className={styles.assumption}>{t('assumption.rate', { rate })}</li>}
        {hasInflation && (
          <li className={styles.assumption}>{t('assumption.inflation', { rate: inflation })}</li>
        )}
        {mode === 'range' && (
          <li className={styles.assumption}>{t('assumption.range', { spread })}</li>
        )}
      </ul>

      <div className={styles.controls}>
        <Button disabled={years === 0} onClick={() => step(-1)}>
          {t('step.back')}
        </Button>
        <label className={styles.range}>
          <span>{t('slider.label', { years, max: maxYears })}</span>
          <input
            type="range"
            min={0}
            max={maxYears}
            step={1}
            value={years}
            aria-valuetext={t('slider.valueText', { years })}
            onChange={(event) => setYears(Number(event.target.value))}
          />
        </label>
        <Button disabled={years === maxYears} onClick={() => step(1)}>
          {t('step.forward')}
        </Button>
      </div>

      <div
        className={styles.chart}
        data-testid="time-chart"
        data-motion={reduced ? 'reduced' : 'full'}
        role="img"
        aria-label={t('chart.label', { years })}
      >
        {bars.map((y) => (
          <span key={y} className={styles.column} data-reached={y <= years}>
            {mode === 'range' ? (
              <span
                className={styles.band}
                style={{
                  height: `${pct(y <= years ? high(y) : 0)}%`,
                  ['--low' as string]: `${(y <= years ? low(y) / Math.max(high(y), 1) : 0) * 100}%`,
                }}
              />
            ) : (
              <span
                className={styles.bar}
                style={{ height: `${pct(y <= years ? base(y) : 0)}%` }}
              />
            )}
          </span>
        ))}
      </div>

      <p className={styles.summary} role="status" aria-live="polite">
        {summary}
      </p>
      {mode === 'basket' && (
        <p className={styles.summary}>
          {t('line.cash', {
            years,
            from: money(initial),
            value: money(inTodaysMoney(initial, years)),
          })}
        </p>
      )}
      {mode === 'range' && (
        <>
          <p className={styles.summary}>
            {t('line.realRange', {
              years,
              low: money(inTodaysMoney(low(years), years)),
              high: money(inTodaysMoney(high(years), years)),
            })}
          </p>
          <p>{t('line.rangeNote')}</p>
        </>
      )}

      <div className={styles.choices} role="group" aria-label={t('choices.label')}>
        {options.map((option) => (
          <Button key={option.id} onClick={() => answer(option)}>
            {option.label}
          </Button>
        ))}
      </div>

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

      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{t(config.hintKeys[hintLevel - 1]!)}</p>}
    </section>
  )
}

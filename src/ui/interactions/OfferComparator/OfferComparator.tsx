import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OfferComparatorConfig, InteractionProps } from '@/core/contracts'
import { loanTotals, schedule } from '@/core/finance/emi'
import { formatINR, type Paise } from '@/core/finance/money'
import { Button } from '@/ui/shell'
import styles from './OfferComparator.module.css'

// shortcut: InteractionProps omits the runner step id; P0-20 binds the real step id.
type Props = InteractionProps<OfferComparatorConfig> & { stepId?: string }

const offer = <O,>(offers: O[], id: string) =>
  offers.find((item) => (item as { id: string }).id === id)

// shortcut: chrome labels use defaultValue until the P1 content task adds them to
// the interactions locale namespace (this task may only touch this folder).
export function OfferComparator({ config, locale, onEvent, onComplete, stepId = '' }: Props) {
  const { t } = useTranslation('interactions')
  const lbl = (key: string, fallback: string) => t(key, { defaultValue: fallback })
  const [selectedId, setSelectedId] = useState(config.offers[0]!.id)
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const completed = useRef(false)
  const instruments = config.investmentInstruments
  if (
    instruments &&
    (new Set(instruments.map((item) => item.id)).size !== instruments.length ||
      instruments.length !== config.offers.length ||
      config.offers.some((item) => !instruments.some((instrument) => instrument.id === item.id)))
  )
    throw new Error('Investment cards must match offer IDs exactly')

  const totals = (instruments ? [] : config.offers).map(
    (item) =>
      [
        item.id,
        loanTotals(
          item.principalPaise as Paise,
          item.annualRatePct,
          item.tenureMonths,
          item.feesPaise as Paise,
        ),
      ] as const,
  )
  const totalOf = (id: string) => totals.find(([offerId]) => offerId === id)![1]
  const selected = offer(config.offers, selectedId) ?? config.offers[0]!
  const rows = instruments
    ? []
    : schedule(selected.principalPaise as Paise, selected.annualRatePct, selected.tenureMonths)
  const money = (paise: Paise) => formatINR(paise, locale)

  const choose = (chosen: OfferComparatorConfig['offers'][number]) => {
    const correct = chosen.id === config.correctOfferId
    onEvent({
      kind: 'choice',
      stepId,
      correct,
      ...(!correct && chosen.error ? { error: chosen.error, severity: chosen.severity } : {}),
    })
    setSelectedId(chosen.id)
    setWrongId(correct ? null : chosen.id)
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

  const budgetLeft = config.budget
    ? config.budget.incomePaise - config.budget.rentPaise - config.budget.essentialsPaise
    : 0

  return (
    <section className={styles.comparator} aria-label={t(config.titleKey)}>
      <h3>{t(config.titleKey)}</h3>
      <p>{t(config.promptKey)}</p>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>

      <ol className={styles.cards}>
        {config.offers.map((offerItem) => {
          const total = instruments ? undefined : totalOf(offerItem.id)
          const instrument = instruments?.find((item) => item.id === offerItem.id)
          const offerLabel = t(instrument?.labelKey ?? offerItem.labelKey)
          return (
            <li
              key={offerItem.id}
              className={styles.card}
              data-selected={offerItem.id === selectedId}
              data-testid={`offer-${offerItem.id}`}
            >
              <h4 className={styles.offerTitle}>{offerLabel}</h4>
              {instrument ? (
                <div className={styles.assumptionText}>
                  <p>{t(instrument.riskKey)}</p>
                  <p>{t(instrument.liquidityKey)}</p>
                  <p>{t(instrument.timeHorizonKey)}</p>
                </div>
              ) : (
                total && (
                  <dl className={styles.figures}>
                    <div>
                      <dt>{lbl('loan.emi', 'EMI')}</dt>
                      <dd>{money(total.emi)}</dd>
                    </div>
                    <div>
                      <dt>{lbl('loan.tenure', 'Tenure')}</dt>
                      <dd>
                        {offerItem.tenureMonths} {lbl('loan.months', 'months')}
                      </dd>
                    </div>
                    <div>
                      <dt>{lbl('loan.fees', 'Fees')}</dt>
                      <dd>{money(offerItem.feesPaise as Paise)}</dd>
                    </div>
                    <div>
                      <dt>{lbl('loan.totalRepaid', 'Total repaid')}</dt>
                      <dd>{money(total.totalRepaid)}</dd>
                    </div>
                    <div>
                      <dt>{lbl('loan.totalInterest', 'Total interest')}</dt>
                      <dd>{money(total.totalInterest)}</dd>
                    </div>
                  </dl>
                )
              )}
              {!instruments && (
                <p className={styles.assumption}>
                  {lbl('loan.assumptionPrefix', 'Assumption')}: {offerItem.annualRatePct}%{' '}
                  {lbl('loan.aYear', 'a year')}
                </p>
              )}
              <p className={styles.assumptionText}>{t(offerItem.assumptionsKey)}</p>
              <div className={styles.cardActions}>
                {!instruments && (
                  <Button
                    aria-pressed={offerItem.id === selectedId}
                    aria-label={`${lbl('loan.viewSchedule', 'View monthly breakdown')}: ${offerLabel}`}
                    onClick={() => setSelectedId(offerItem.id)}
                  >
                    {lbl('loan.viewSchedule', 'View monthly breakdown')}
                  </Button>
                )}
                <Button
                  variant="primary"
                  aria-label={`${lbl('loan.choose', 'Choose')}: ${offerLabel}`}
                  onClick={() => choose(offerItem)}
                >
                  {lbl('loan.choose', 'Choose')}
                </Button>
              </div>
              {wrongId === offerItem.id && (
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
            </li>
          )
        })}
      </ol>

      {!instruments && config.budget && (
        <section
          className={styles.budget}
          aria-label={`${lbl('loan.budget.title', 'Monthly budget')}: ${t(selected.labelKey)}`}
        >
          <h4>{lbl('loan.budget.title', 'Monthly budget')}</h4>
          <dl className={styles.figures}>
            <div>
              <dt>{lbl('loan.budget.income', 'Income')}</dt>
              <dd>{money(config.budget.incomePaise as Paise)}</dd>
            </div>
            <div>
              <dt>{lbl('loan.budget.rent', 'Rent')}</dt>
              <dd>{money(config.budget.rentPaise as Paise)}</dd>
            </div>
            <div>
              <dt>{lbl('loan.budget.essentials', 'Essentials')}</dt>
              <dd>{money(config.budget.essentialsPaise as Paise)}</dd>
            </div>
            <div>
              <dt>{lbl('loan.budget.left', 'Left before loan')}</dt>
              <dd>{money(budgetLeft as Paise)}</dd>
            </div>
            <div>
              <dt>{lbl('loan.budget.emi', 'EMI for selected offer')}</dt>
              <dd>{money(totalOf(selected.id).emi)}</dd>
            </div>
            <div>
              <dt>{lbl('loan.budget.afterEmi', 'Left for savings after EMI')}</dt>
              <dd>{money((budgetLeft - totalOf(selected.id).emi) as Paise)}</dd>
            </div>
          </dl>
        </section>
      )}

      {!instruments && (
        <section
          className={styles.breakdown}
          aria-label={`${lbl('loan.scheduleCaption', 'Month-by-month principal and interest')}: ${t(selected.labelKey)}`}
        >
          <h4>{lbl('loan.scheduleCaption', 'Month-by-month principal and interest')}</h4>
          <table className={styles.schedule}>
            <caption className={styles.caption}>
              {`${lbl('loan.scheduleCaption', 'Month-by-month principal and interest')}: ${t(selected.labelKey)}`}
            </caption>
            <thead>
              <tr>
                <th scope="col">{lbl('loan.month', 'Month')}</th>
                <th scope="col">{lbl('loan.split', 'Principal / interest')}</th>
                <th scope="col">{lbl('loan.principal', 'Principal')}</th>
                <th scope="col">{lbl('loan.interest', 'Interest')}</th>
                <th scope="col">{lbl('loan.balance', 'Balance')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const paid = row.principalPaid + row.interestPaid
                const principalWidth = paid > 0 ? (row.principalPaid / paid) * 100 : 0
                return (
                  <tr key={index}>
                    <th scope="row">{index + 1}</th>
                    <td>
                      <span className={styles.bar} aria-hidden="true">
                        <span
                          className={styles.barPrincipal}
                          style={{ width: `${principalWidth}%` }}
                        />
                      </span>
                    </td>
                    <td>{money(row.principalPaid)}</td>
                    <td>{money(row.interestPaid)}</td>
                    <td>{money(row.balance)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}

      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{t(config.hintKeys[hintLevel - 1]!)}</p>}
    </section>
  )
}

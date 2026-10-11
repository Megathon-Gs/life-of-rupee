import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InteractionProps, ReceiptInspectorConfig } from '@/core/contracts'
import { formatINR, type Paise } from '@/core/finance/money'
import { receiptTotals, type ReceiptLine } from '@/core/finance/receipt'
import { Button } from '@/ui/shell'
import styles from './ReceiptInspector.module.css'

// shortcut: InteractionProps omits the runner step id; P0-20 binds the real step id.
type Props = InteractionProps<ReceiptInspectorConfig> & { stepId?: string }

/** The two lines the student must find, in order: the tax, then the payable total. */
type Target = 'tax' | 'total'

type Row = { id: string; label: string; amount: Paise; note?: string }

export function ReceiptInspector({ config, locale, onEvent, onComplete, stepId = '' }: Props) {
  const { t } = useTranslation('receiptInspector')
  const { t: tc } = useTranslation()
  const money = (amount: Paise) => formatINR(amount, locale)

  const lines: ReceiptLine[] = config.items.map((item) => ({
    unitPrice: item.unitPricePaise as Paise,
    quantity: item.quantity ?? 1,
  }))
  // Every receipt number is derived here, never typed into content.
  const totals = receiptTotals(lines, {
    discount: config.discountPaise as Paise,
    taxRatePct: config.taxRatePct,
    taxOnDiscounted: config.taxOnDiscounted,
  })

  const rows: Row[] = [
    ...config.items.map((item) => {
      const quantity = item.quantity ?? 1
      return {
        id: `item:${item.id}`,
        label: tc(item.labelKey),
        amount: (item.unitPricePaise * quantity) as Paise,
        note:
          quantity > 1
            ? t('receipt.lineNote', { qty: quantity, unit: money(item.unitPricePaise as Paise) })
            : undefined,
      }
    }),
    { id: 'subtotal', label: t('receipt.subtotal'), amount: totals.subtotal },
    { id: 'discount', label: t('receipt.discount'), amount: totals.discount },
    {
      id: 'tax',
      label: t('receipt.tax', { rate: config.taxRatePct }),
      amount: totals.tax,
    },
    { id: 'total', label: t('receipt.total'), amount: totals.total },
  ]

  const [target, setTarget] = useState<Target>('tax')
  const [wrong, setWrong] = useState<string | null>(null)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const completed = useRef(false)

  const pick = (id: string) => {
    const correct = target === 'tax' ? id === 'tax' : id === 'total'
    setExplanationOpen(false)
    if (correct) {
      onEvent({ kind: 'choice', stepId, correct: true })
      setWrong(null)
      if (target === 'tax') {
        setTarget('total')
      } else if (!completed.current) {
        completed.current = true
        onComplete()
      }
      return
    }
    const error =
      target === 'tax' || id !== 'subtotal'
        ? config.errors.missedTax
        : config.errors.discountBeforeTax
    onEvent({ kind: 'choice', stepId, correct: false, error, severity: 'major' })
    setWrong(id)
  }

  const showHint = () => {
    const level = Math.min(hintLevel + 1, 2) as 1 | 2
    setHintLevel(level)
    onEvent({ kind: 'hint', stepId, level })
  }

  return (
    <section className={styles.inspector} aria-label={tc(config.titleKey)}>
      <h3>{tc(config.titleKey)}</h3>
      <p>{tc(config.promptKey)}</p>
      <p className={styles.banner} role="note">
        {t('banner')}
      </p>

      <ul className={styles.receipt} aria-label={t('receipt.label')}>
        {rows.map((row) => (
          <li key={row.id}>
            <Button
              className={styles.line}
              data-testid={`line-${row.id}`}
              onClick={() => pick(row.id)}
            >
              <span className={styles.lineLabel}>{row.label}</span>
              <span className={styles.lineAmount}>{money(row.amount)}</span>
            </Button>
            {row.note && <p className={styles.lineNote}>{row.note}</p>}
          </li>
        ))}
      </ul>

      <p className={styles.ask} aria-live="polite">
        {target === 'tax' ? t('ask.tax') : t('ask.total')}
      </p>

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
          {explanationOpen && <p>{tc(config.explanationKey)}</p>}
        </div>
      )}

      <Button disabled={hintLevel === 2} onClick={showHint}>
        {t('hint.control')}
      </Button>
      {hintLevel > 0 && <p role="status">{tc(config.hintKeys[hintLevel - 1]!)}</p>}
    </section>
  )
}

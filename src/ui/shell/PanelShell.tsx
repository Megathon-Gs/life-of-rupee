import { useEffect, useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { PixelIcon } from './PixelIcon'
import styles from './PanelShell.module.css'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface PanelShellProps {
  open: boolean
  /**
   * Called with `true` when the panel opens and `false` when it asks to close
   * (Escape, Close, scrim). The app uses it to make the world `inert` and pause
   * travel, and owns the `open` state.
   */
  onOpenChange: (open: boolean) => void
  /** Panel title, already translated. */
  title: string
  children: ReactNode
  /** Sticky action row under the scrolling body. */
  footer?: ReactNode
}

/**
 * Modal container for focused tasks (financial panels, settings, skill tree).
 * Phone: a bottom sheet. Desktop: a docked side panel with the street still
 * visible. Traps focus, closes on Escape, contains scroll, restores focus to
 * whatever opened it.
 */
export function PanelShell({ open, onOpenChange, title, children, footer }: PanelShellProps) {
  const { t } = useTranslation('ui')
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const notify = useRef(onOpenChange)
  useLayoutEffect(() => {
    notify.current = onOpenChange
  })

  useLayoutEffect(() => {
    if (!open) return
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()
    return () => {
      const opener = openerRef.current
      if (opener?.isConnected) opener.focus()
    }
  }, [open])

  useEffect(() => {
    if (open) notify.current(true)
  }, [open])

  if (!open) return null

  const close = () => notify.current(false)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close()
      return
    }
    if (event.key !== 'Tab') return
    const items = [...(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
    if (items.length === 0) {
      event.preventDefault()
      return
    }
    const first = items[0]!
    const last = items[items.length - 1]!
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={styles.layer}>
      <div className={styles.scrim} onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <Button iconOnly aria-label={t('panel.close')} onClick={close}>
            <PixelIcon name="close" scale={2} />
          </Button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}

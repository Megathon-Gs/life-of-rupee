import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProfileSummary } from '@/core/contracts'
import { Button } from '@/ui/shell'
import styles from './App.module.css'

export interface ProfilePickerProps {
  profiles: ProfileSummary[]
  busy: boolean
  onCreate: () => void
  onSelect: (localId: string) => void
  onRemove: (localId: string) => void
}

/** Where focus goes after the next render: a row's button, or New player. */
type FocusTarget =
  | { kind: 'confirm'; localId: string }
  | { kind: 'remove'; localId: string }
  | { kind: 'afterRemove'; index: number; from: ProfileSummary[] }

/** Start screen: pick, create or remove a local player. Removing asks once more. */
export function ProfilePicker({
  profiles,
  busy,
  onCreate,
  onSelect,
  onRemove,
}: ProfilePickerProps) {
  const { t } = useTranslation('app')
  const titleId = useId()
  const [confirming, setConfirming] = useState<string | null>(null)
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null)
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const newRef = useRef<HTMLButtonElement>(null)

  const bind = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) buttons.current.set(key, el)
    else buttons.current.delete(key)
  }

  useEffect(() => {
    if (!focusTarget || busy) return
    if (focusTarget.kind === 'afterRemove' && focusTarget.from === profiles) return
    let el: HTMLButtonElement | null | undefined
    if (focusTarget.kind === 'confirm') el = buttons.current.get(`confirm:${focusTarget.localId}`)
    else if (focusTarget.kind === 'remove')
      el = buttons.current.get(`remove:${focusTarget.localId}`)
    else {
      // Wait for the refreshed list. A removed row hands focus to the row that took its place, else the last row.
      const next = profiles[Math.min(focusTarget.index, profiles.length - 1)]
      el = next ? buttons.current.get(`select:${next.localId}`) : newRef.current
    }
    el?.focus()
    setFocusTarget(null)
  }, [focusTarget, busy, profiles])

  return (
    <section className={styles.picker} data-testid="profile-picker" aria-labelledby={titleId}>
      <h1 id={titleId}>{t('picker.title')}</h1>
      <p>{t('picker.intro')}</p>
      {profiles.length === 0 ? (
        <p>{t('picker.empty')}</p>
      ) : (
        <ul className={styles.profiles}>
          {profiles.map(({ localId, displayName }, index) => (
            <li key={localId} className={styles.profile}>
              {confirming === localId ? (
                <>
                  <p>{t('picker.confirmRemove', { name: displayName })}</p>
                  <Button
                    ref={bind(`confirm:${localId}`)}
                    data-testid={`profile-remove-confirm-${localId}`}
                    disabled={busy}
                    onClick={() => {
                      setConfirming(null)
                      setFocusTarget({ kind: 'afterRemove', index, from: profiles })
                      onRemove(localId)
                    }}
                  >
                    {t('picker.remove', { name: displayName })}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setConfirming(null)
                      setFocusTarget({ kind: 'remove', localId })
                    }}
                  >
                    {t('picker.cancel')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    ref={bind(`select:${localId}`)}
                    variant="primary"
                    data-testid={`profile-select-${localId}`}
                    disabled={busy}
                    onClick={() => onSelect(localId)}
                  >
                    {t('picker.play', { name: displayName })}
                  </Button>
                  <Button
                    ref={bind(`remove:${localId}`)}
                    variant="quiet"
                    data-testid={`profile-remove-${localId}`}
                    disabled={busy}
                    onClick={() => {
                      setConfirming(localId)
                      setFocusTarget({ kind: 'confirm', localId })
                    }}
                  >
                    {t('picker.remove', { name: displayName })}
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <Button
        ref={newRef}
        variant="primary"
        data-testid="profile-new"
        disabled={busy}
        onClick={onCreate}
      >
        {t('picker.new')}
      </Button>
    </section>
  )
}

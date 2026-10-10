import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { UiSettings } from './UiRoot'
import styles from './SettingsPanel.module.css'

export interface SettingsPanelProps {
  settings: UiSettings
  /** Called with the one field that changed; the app persists it. */
  onChange: (patch: Partial<UiSettings>) => void
}

type Option<V> = { value: V; label: string; lang?: string }

function Choice<V extends string | number | boolean>({
  legend,
  name,
  options,
  value,
  onSelect,
  hint,
}: {
  legend: string
  name: string
  options: Option<V>[]
  value: V
  onSelect: (value: V) => void
  hint?: string
}) {
  const hintId = useId()
  return (
    <fieldset className={styles.group} aria-describedby={hint ? hintId : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map(option => (
          <label key={String(option.value)} className={styles.option} lang={option.lang}>
            <input
              type="radio"
              className={styles.input}
              name={name}
              checked={option.value === value}
              onChange={() => onSelect(option.value)}
            />
            <span className={styles.face}>{option.label}</span>
          </label>
        ))}
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </fieldset>
  )
}

/**
 * Language, motion, sound and text size. Content for a PanelShell; every
 * control is a native input so it works with keyboard, touch and screen readers.
 */
export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const { t } = useTranslation('ui')
  const name = useId()
  return (
    <div className={styles.settings}>
      <Choice
        legend={t('settings.language')}
        name={`${name}-locale`}
        value={settings.locale}
        onSelect={locale => onChange({ locale })}
        options={[
          { value: 'en', label: 'English', lang: 'en' },
          { value: 'te', label: 'తెలుగు', lang: 'te' },
        ]}
      />
      <Choice<UiSettings['reducedMotion']>
        legend={t('settings.motion')}
        name={`${name}-motion`}
        value={settings.reducedMotion}
        onSelect={reducedMotion => onChange({ reducedMotion })}
        hint={t('settings.motionHint')}
        options={[
          { value: 'system', label: t('settings.motionSystem') },
          { value: true, label: t('settings.motionReduced') },
          { value: false, label: t('settings.motionFull') },
        ]}
      />
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t('settings.sound')}</legend>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            role="switch"
            className={styles.input}
            checked={settings.muted}
            onChange={event => onChange({ muted: event.target.checked })}
          />
          <span className={styles.track} aria-hidden="true">
            <span className={styles.thumb} />
          </span>
          <span>{t('settings.mute')}</span>
        </label>
      </fieldset>
      <Choice<UiSettings['textScale']>
        legend={t('settings.textSize')}
        name={`${name}-text`}
        value={settings.textScale}
        onSelect={textScale => onChange({ textScale })}
        options={[
          { value: 1, label: t('settings.textStandard') },
          { value: 1.25, label: t('settings.textLarge') },
          { value: 1.5, label: t('settings.textLarger') },
        ]}
      />
    </div>
  )
}

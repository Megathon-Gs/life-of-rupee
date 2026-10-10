import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import type { Settings } from '@/core/contracts'
import '../tokens'

/** The subset of player settings the shell renders from. */
export type UiSettings = Pick<Settings, 'locale' | 'reducedMotion' | 'muted' | 'textScale'>

const ReducedMotionSetting = createContext<UiSettings['reducedMotion']>('system')

const QUERY = '(prefers-reduced-motion: reduce)'
const subscribe = (notify: () => void) => {
  if (typeof matchMedia !== 'function') return () => {}
  const media = matchMedia(QUERY)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const systemPrefersReduced = () => typeof matchMedia === 'function' && matchMedia(QUERY).matches

/** True when motion should be reduced: the in-game toggle wins, else the OS preference. */
export function useReducedMotion(): boolean {
  const setting = useContext(ReducedMotionSetting)
  const system = useSyncExternalStore(subscribe, systemPrefersReduced, () => false)
  return setting === 'system' ? system : setting
}

export interface UiRootProps {
  settings: Pick<UiSettings, 'locale' | 'reducedMotion' | 'textScale'>
  className?: string
  children: ReactNode
}

/**
 * Scopes the design tokens, language, text size and motion setting for all UI
 * below it. Every shell component expects to render inside one.
 */
export function UiRoot({ settings, className, children }: UiRootProps) {
  return (
    <ReducedMotionSetting.Provider value={settings.reducedMotion}>
      <div
        data-ps-ui=""
        lang={settings.locale}
        data-text-scale={String(settings.textScale)}
        data-reduced-motion={String(settings.reducedMotion)}
        className={className}
      >
        {children}
      </div>
    </ReducedMotionSetting.Provider>
  )
}

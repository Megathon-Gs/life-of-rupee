import type { SaveStore } from '../core/contracts'

export function installLifecycleFlush(store: SaveStore): () => void {
  const flush = () => { void store.flush() }
  const visibility = () => { if (document.visibilityState === 'hidden') flush() }
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('pagehide', flush)
  return () => {
    document.removeEventListener('visibilitychange', visibility)
    window.removeEventListener('pagehide', flush)
  }
}

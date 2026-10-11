import { warmAssetCache } from './assets'
import { registerServiceWorker } from './register'
import { installStoragePressureHandling, requestPersistentStorage } from './storage'
import { createUpdateGate, isLevelActive } from './update'

/** Test-only seam exposed when the URL carries `pwaTest` (see tests/e2e/offline). */
export interface PwaTestHandle {
  simulateUpdateReady(): void
  applyUpdate(): Promise<void>
  isLevelActive(): boolean
}

declare global {
  interface Window {
    __paisaPwa?: PwaTestHandle
  }
}

/**
 * Run non-critical work once the page has finished loading and its first paint
 * (the LCP window) has settled, so precaching and atlas warm-up never compete
 * with the initial render.
 */
const DEFER_AFTER_LOAD_MS = 2000

function afterLoad(task: () => void): void {
  const run = () => {
    window.setTimeout(() => {
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => task(), { timeout: 2000 })
        return
      }
      task()
    }, DEFER_AFTER_LOAD_MS)
  }
  if (document.readyState === 'complete') run()
  else window.addEventListener('load', run, { once: true })
}

/**
 * Boot the offline layer: register the waiting-update service worker, ask for
 * persistent storage, warm the lazy asset cache, and drill down on quota pressure.
 */
export function registerPwa(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  let applyUpdate: () => void = () => {}
  const gate = createUpdateGate({
    applyUpdate: async () => applyUpdate(),
    reload: () => location.reload(),
  })

  afterLoad(() => {
    const sw = registerServiceWorker(() => gate.markReady())
    applyUpdate = () => sw.apply()
    // Poll for a deploy while the tab stays open; the update waits for a non-level moment.
    setInterval(() => void sw.check(), 60 * 60 * 1000)

    void requestPersistentStorage()
    installStoragePressureHandling()
    void warmAssetCache()
  })

  if (new URLSearchParams(location.search).has('pwaTest')) {
    window.__paisaPwa = {
      simulateUpdateReady: () => gate.simulate(),
      applyUpdate: () => gate.apply(),
      isLevelActive,
    }
  }
}

registerPwa()
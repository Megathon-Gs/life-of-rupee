import { ASSET_BASE, parseManifest } from '@/world/assets/manifest'

/** Must match `workbox.runtimeCaching` in vite.config.ts. */
const ASSET_CACHE = 'paisa-assets'
const ASSET_MANIFEST_PATH = `${ASSET_BASE}/manifest.json`

/**
 * Cache every district atlas named by the content-hashed manifest on first visit.
 * The app shell and the first level are precached, so a failed warm-up (offline on
 * first launch) never blocks play; later visits read these from Cache Storage.
 */
export async function warmAssetCache(): Promise<void> {
  if (!('caches' in window)) return
  try {
    const response = await fetch(ASSET_MANIFEST_PATH)
    if (response.ok) {
      const manifest = parseManifest(await response.json())
      const cache = await caches.open(ASSET_CACHE)
      await Promise.all(
        Object.values(manifest.districts).map(async ({ atlas }) => {
          const url = `${ASSET_BASE}/${atlas}`
          const asset = await fetch(url)
          if (asset.ok) await cache.put(url, asset)
        }),
      )
    }
  } catch {
    // Offline first visit: precache still serves the shell and first level.
  }
  // An active worker is not enough: it must control this page before we can go offline.
  if ('serviceWorker' in navigator) {
    const workers = navigator.serviceWorker
    await workers.ready
    await new Promise<void>((resolve) => {
      const controlled = () => {
        if (!workers.controller) return
        workers.removeEventListener('controllerchange', controlled)
        resolve()
      }
      workers.addEventListener('controllerchange', controlled)
      controlled()
    })
  }
  // e2e waits for this flag before cutting the network, so the lazy cache is warm.
  document.documentElement.dataset.pwaAssets = 'ready'
}

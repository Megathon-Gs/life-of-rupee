/** Ask the browser to keep our saves and caches when device storage is tight. */
export function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return Promise.resolve(false)
  return navigator.storage.persist().catch(() => false)
}

/** True when the browser refused a write because storage is full. */
export function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.code === 22)
  )
}

/** Delete every Cache Storage bucket. IndexedDB saves are never touched. */
export async function evictCachedAssets(): Promise<number> {
  if (!('caches' in window)) return 0
  const names = await caches.keys()
  const deleted = await Promise.all(names.map((name) => caches.delete(name)))
  return deleted.filter(Boolean).length
}

/**
 * Under storage pressure keep the save and drop cached assets first: a quota
 * rejection evicts Cache Storage, never IndexedDB. The next online visit re-caches.
 */
export function installStoragePressureHandling(): void {
  window.addEventListener('unhandledrejection', (event) => {
    if (!isQuotaExceeded(event.reason)) return
    event.preventDefault()
    void evictCachedAssets()
  })
}
const SW_URL = '/sw.js'

export interface SwController {
  /** Tell the waiting worker to activate, then reload once it does. */
  apply(): void
  /** Ask the browser to look for a newer worker. */
  check(): Promise<void>
}

/**
 * Register the generated service worker and surface a waiting update.
 * `clientsClaim` is off, so nothing takes over mid-session: the new worker only
 * becomes active after `apply()` and the page reloads itself.
 */
export function registerServiceWorker(onNeedRefresh: () => void): SwController {
  let waiting: ServiceWorker | null = null

  const noteWaiting = (registration: ServiceWorkerRegistration) => {
    if (!registration.waiting || !navigator.serviceWorker.controller) return
    waiting = registration.waiting
    onNeedRefresh()
  }

  const watch = (registration: ServiceWorkerRegistration) => {
    noteWaiting(registration)
    const installing = registration.installing
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed') noteWaiting(registration)
    })
    registration.addEventListener('updatefound', () => {
      const fresh = registration.installing
      fresh?.addEventListener('statechange', () => {
        if (fresh.state === 'installed') noteWaiting(registration)
      })
    })
  }

  void navigator.serviceWorker
    .register(SW_URL)
    .then((registration) => {
      watch(registration)
      if (registration.active) return registration.update()
      return undefined
    })
    .catch(() => {
      // No worker (dev server) or registration blocked: the app still runs online.
    })

  return {
    apply() {
      const worker = waiting
      if (!worker) return
      worker.addEventListener('statechange', () => {
        if (worker.state === 'activated') location.reload()
      })
      worker.postMessage({ type: 'SKIP_WAITING' })
    },
    check() {
      return navigator.serviceWorker
        .getRegistration()
        .then((registration) => registration?.update())
        .then(() => undefined)
        .catch(() => undefined)
    },
  }
}
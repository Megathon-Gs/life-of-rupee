import type { Page } from '@playwright/test'

/** Shared probes for the G2 privacy specs. */
export type G2Window = Window & { __g2?: { typing: string[]; channels: string[] } }

/** Records, from before the app boots, every typing control and every non-fetch channel. */
export async function watch(page: Page) {
  await page.addInitScript(() => {
    const seen: { typing: string[]; channels: string[] } = { typing: [], channels: [] }
    ;(window as G2Window).__g2 = seen
    const typing =
      'textarea, [contenteditable]:not([contenteditable="false"]), input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="hidden"])'
    const scan = (root: ParentNode) => {
      for (const el of root.querySelectorAll(typing)) {
        seen.typing.push(`${el.tagName.toLowerCase()}[type=${el.getAttribute('type') ?? ''}]`)
      }
    }
    new MutationObserver(() => scan(document)).observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
    })
    const note = (what: string) => seen.channels.push(what)
    const beacon = navigator.sendBeacon?.bind(navigator)
    if (beacon) navigator.sendBeacon = (url) => (note(`beacon ${String(url)}`), false)
    for (const name of ['WebSocket', 'EventSource', 'RTCPeerConnection'] as const) {
      const Original = window[name] as unknown as (new (...a: unknown[]) => object) | undefined
      if (!Original) continue
      Object.defineProperty(window, name, {
        value: new Proxy(Original, {
          construct(target, args) {
            note(`${name} ${String(args[0] ?? '')}`)
            return Reflect.construct(target, args)
          },
        }),
      })
    }
    const open = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ) {
      if (method.toUpperCase() !== 'GET') note(`xhr ${method} ${String(url)}`)
      return (open as (...a: unknown[]) => void).call(this, method, url, ...rest)
    }
  })
}

/** Every IndexedDB row and web-storage entry on the device, as one JSON string per store. */
export async function deviceStorage(page: Page) {
  return page.evaluate(async () => {
    const dump: Record<string, unknown> = {
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
    }
    for (const { name } of await indexedDB.databases()) {
      if (!name) continue
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const open = indexedDB.open(name)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => resolve(open.result)
      })
      for (const store of Array.from(db.objectStoreNames)) {
        dump[`idb:${name}/${store}`] = await new Promise((resolve, reject) => {
          const all = db.transaction(store).objectStore(store).getAll()
          all.onerror = () => reject(all.error)
          all.onsuccess = () => resolve(all.result)
        })
      }
      db.close()
    }
    return dump
  })
}

/** Shapes of real identifiers; none may appear anywhere the device stores. */
export const IDENTIFIERS: Record<string, RegExp> = {
  email: /[\w.+-]+@[\w-]+\.[\w.-]+/,
  upiHandle: /\b[\w.-]{3,}@(?:ok\w+|ybl|paytm|upi|axl|ibl|sbi|apl)\b/i,
  indianMobile: /(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)/,
  aadhaar: /(?<!\d)\d{4}\s\d{4}\s\d{4}(?!\d)|(?<!\d)\d{12}(?!\d)/,
  pan: /\b[A-Z]{5}\d{4}[A-Z]\b/,
  ifsc: /\b[A-Z]{4}0[A-Z0-9]{6}\b/,
}

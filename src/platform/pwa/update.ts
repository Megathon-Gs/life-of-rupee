const LEVEL_SELECTOR = '[data-testid="level-step"]'
const TOAST_TESTID = 'pwa-update'

/** A level is open when its step panel is in the DOM (results included, panel closed). */
export function isLevelActive(root: ParentNode = document): boolean {
  return root.querySelector(LEVEL_SELECTOR) !== null
}

export interface UpdateGateOptions {
  /** Applies the waiting service worker; only ever called on explicit user action. */
  applyUpdate: () => Promise<void>
  /** Reloads after a simulated update that has no waiting worker. Test only. */
  reload?: () => void
}

export interface UpdateGate {
  /** A new version finished installing and is waiting. */
  markReady(): void
  /** Test seam: pretend a deploy happened without a second build. */
  simulate(): void
  /** Applies the waiting update, then reloads. */
  apply(): Promise<void>
  dispose(): void
}

function createToast(onUpdate: () => void): HTMLDivElement {
  const toast = document.createElement('div')
  toast.dataset.testid = TOAST_TESTID
  toast.setAttribute('role', 'status')
  toast.style.cssText =
    'position:fixed;left:50%;bottom:1rem;transform:translateX(-50%);display:none;' +
    'align-items:center;gap:.75rem;padding:.5rem .75rem;border-radius:.5rem;' +
    'background:#1f2937;color:#fff;font:14px system-ui;z-index:2147483647'
  const label = document.createElement('span')
  label.textContent = 'A new version is ready'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Update'
  button.style.cssText = 'padding:.25rem .75rem;border:0;border-radius:.375rem;cursor:pointer'
  button.addEventListener('click', onUpdate)
  toast.append(label, button)
  return toast
}

/**
 * Holds a waiting update until the player is outside a level, then offers "Update".
 * Nothing reloads mid-level; applying the update is always an explicit user action.
 */
export function createUpdateGate(options: UpdateGateOptions): UpdateGate {
  let needRefresh = false
  let simulated = false
  const toast = createToast(() => void apply())
  document.body.append(toast)

  const sync = () => {
    toast.style.display = needRefresh && !isLevelActive() ? 'flex' : 'none'
  }
  const observer = new MutationObserver(sync)
  observer.observe(document.body, { childList: true, subtree: true })

  const apply = async () => {
    if (!needRefresh) return
    needRefresh = false
    sync()
    await options.applyUpdate()
    // A real update reloads once the new worker controls; a simulated one has none.
    if (simulated) options.reload?.()
  }

  return {
    markReady() {
      needRefresh = true
      simulated = false
      sync()
    },
    simulate() {
      needRefresh = true
      simulated = true
      sync()
    },
    apply,
    dispose() {
      observer.disconnect()
      toast.remove()
    },
  }
}
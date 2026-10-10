import { expect, it, vi } from 'vitest'
import type { SaveStore } from '../core/contracts'
import { installLifecycleFlush } from './lifecycle'

it('flushes when hidden or on pagehide, and removes listeners on cleanup', () => {
  const flush = vi.fn<SaveStore['flush']>().mockResolvedValue(undefined)
  const visibility = vi.spyOn(document, 'visibilityState', 'get')
  const cleanup = installLifecycleFlush({
    flush,
    load: vi.fn(),
    save: vi.fn(),
    listProfiles: vi.fn(),
    createProfile: vi.fn(),
    removeProfile: vi.fn(),
  })
  try {
    visibility.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(flush).not.toHaveBeenCalled()

    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(flush).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new Event('pagehide'))
    expect(flush).toHaveBeenCalledTimes(2)

    cleanup()
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('pagehide'))
    expect(flush).toHaveBeenCalledTimes(2)
  } finally {
    cleanup()
    visibility.mockRestore()
  }
})

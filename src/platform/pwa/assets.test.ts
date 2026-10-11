import { afterEach, describe, expect, it, vi } from 'vitest'
import { warmAssetCache } from './assets'

afterEach(() => {
  delete document.documentElement.dataset.pwaAssets
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function setup(controlled = false) {
  const workers = Object.assign(new EventTarget(), {
    ready: Promise.resolve({}),
    controller: controlled ? {} : null,
  })
  const put = vi.fn(async () => {})
  const open = vi.fn(async () => ({ put }))
  vi.stubGlobal('navigator', { serviceWorker: workers })
  vi.stubGlobal('caches', { open })
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: 1, districts: { urban: { atlas: 'urban.hash.png' } } }),
      })
      .mockResolvedValue({ ok: true }),
  )
  return { workers, put }
}

describe('warmAssetCache', () => {
  it('waits for page control, not just an active worker, before reporting offline ready', async () => {
    const { workers, put } = setup()
    const listen = vi.spyOn(workers, 'addEventListener')
    const remove = vi.spyOn(workers, 'removeEventListener')
    const warm = warmAssetCache()
    await vi.waitFor(() =>
      expect(listen).toHaveBeenCalledWith('controllerchange', expect.any(Function)),
    )
    expect(put).toHaveBeenCalledWith('/assets/urban.hash.png', { ok: true })
    expect(document.documentElement.dataset.pwaAssets).toBeUndefined()

    workers.dispatchEvent(new Event('controllerchange'))
    expect(document.documentElement.dataset.pwaAssets).toBeUndefined()
    workers.controller = {}
    workers.dispatchEvent(new Event('controllerchange'))
    await warm
    expect(document.documentElement.dataset.pwaAssets).toBe('ready')
    expect(remove).toHaveBeenCalledWith('controllerchange', expect.any(Function))
  })

  it('does not wait for another event when the page is already controlled', async () => {
    setup(true)
    await warmAssetCache()
    expect(document.documentElement.dataset.pwaAssets).toBe('ready')
  })

  it('keeps playing when atlas warm-up fails on an already controlled offline page', async () => {
    setup(true)
    vi.mocked(fetch).mockRejectedValue(new Error('offline'))
    await warmAssetCache()
    expect(document.documentElement.dataset.pwaAssets).toBe('ready')
  })
})

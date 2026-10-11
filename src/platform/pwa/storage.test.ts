import { afterEach, describe, expect, test, vi } from 'vitest'
import { evictCachedAssets, installStoragePressureHandling, isQuotaExceeded } from './storage'

describe('isQuotaExceeded', () => {
  test('detects a quota error', () => {
    expect(isQuotaExceeded(new DOMException('full', 'QuotaExceededError'))).toBe(true)
  })

  test('ignores other errors', () => {
    expect(isQuotaExceeded(new Error('nope'))).toBe(false)
    expect(isQuotaExceeded(undefined)).toBe(false)
  })
})

describe('evictCachedAssets', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('deletes every Cache Storage bucket and leaves IndexedDB alone', async () => {
    const deleted: string[] = []
    vi.stubGlobal('caches', {
      keys: async () => ['workbox-precache', 'paisa-assets'],
      delete: async (name: string) => {
        deleted.push(name)
        return true
      },
    })

    await expect(evictCachedAssets()).resolves.toBe(2)
    expect(deleted).toEqual(['workbox-precache', 'paisa-assets'])
  })
})

describe('installStoragePressureHandling', () => {
  afterEach(() => vi.unstubAllGlobals())

  test('drops cached assets on a quota rejection', async () => {
    const deleted: string[] = []
    vi.stubGlobal('caches', {
      keys: async () => ['workbox-precache'],
      delete: async (name: string) => {
        deleted.push(name)
        return true
      },
    })

    installStoragePressureHandling()
    const event = new Event('unhandledrejection') as Event & { reason: unknown }
    event.reason = new DOMException('full', 'QuotaExceededError')
    window.dispatchEvent(event)

    await vi.waitFor(() => expect(deleted).toEqual(['workbox-precache']))
  })
})
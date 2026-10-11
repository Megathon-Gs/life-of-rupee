import { afterEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from './randomUUID'

describe('randomUUID', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses the native UUID implementation when available', () => {
    const native = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('12345678-1234-4234-8234-123456789abc')
    expect(randomUUID()).toBe('12345678-1234-4234-8234-123456789abc')
    expect(native).toHaveBeenCalledOnce()
  })

  it('uses 16 cryptographically random bytes and sets UUID v4 version and variant bits', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => bytes.fill(255))
    vi.stubGlobal('crypto', { getRandomValues })
    expect(randomUUID()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
    expect(getRandomValues).toHaveBeenCalledOnce()
    expect(getRandomValues.mock.calls[0]![0]).toHaveLength(16)
  })

  it('fails rather than using insecure randomness if secure randomness is unavailable', () => {
    vi.stubGlobal('crypto', {})
    const insecure = vi.spyOn(Math, 'random')
    expect(() => randomUUID()).toThrow()
    expect(insecure).not.toHaveBeenCalled()
  })
})

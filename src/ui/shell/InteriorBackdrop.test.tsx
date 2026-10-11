import { act, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocationId } from '@/core/contracts'
import { renderUi } from '@/ui/testing/renderUi'
import { InteriorBackdrop } from './InteriorBackdrop'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('InteriorBackdrop', () => {
  it.each(['bank', 'phone-shop', 'showroom'] as const)(
    'renders a decorative %s image',
    (location) => {
      renderUi(<InteriorBackdrop location={location as LocationId} />)
      const image = screen.getByTestId('interior-backdrop').querySelector('img')!
      expect(image.getAttribute('src')).toBe(`/interiors/${location}.png`)
      expect(image.getAttribute('alt')).toBe('')
      expect(image.getAttribute('aria-hidden')).toBe('true')
      expect(screen.queryByRole('img')).toBeNull()
    },
  )

  it('renders nothing for a location without a backdrop', () => {
    renderUi(<InteriorBackdrop location={'home' as LocationId} />)
    expect(screen.queryByTestId('interior-backdrop')).toBeNull()
  })

  it('updates the image when the location changes', () => {
    const { rerender } = renderUi(<InteriorBackdrop location={'home' as LocationId} />)
    rerender(<InteriorBackdrop location={'bank' as LocationId} />)
    expect(screen.getByTestId('interior-backdrop').querySelector('img')?.getAttribute('src')).toBe(
      '/interiors/bank.png',
    )
    rerender(<InteriorBackdrop location={'phone-shop' as LocationId} />)
    expect(screen.getByTestId('interior-backdrop').querySelector('img')?.getAttribute('src')).toBe(
      '/interiors/phone-shop.png',
    )
  })

  it('disables its fade for reduced motion', () => {
    renderUi(<InteriorBackdrop location={'bank' as LocationId} />, { reducedMotion: true })
    expect(screen.getByTestId('interior-backdrop').getAttribute('data-reduced-motion')).toBe('true')
  })

  it('uses integer scaling, remeasures on resize, and disconnects on close', () => {
    const disconnect = vi.fn()
    const observe = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe
        disconnect = disconnect
      },
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 840,
      height: 900,
    } as DOMRect)
    vi.stubGlobal('innerWidth', 1440)
    const { unmount } = renderUi(<InteriorBackdrop location={'bank' as LocationId} />)
    const image = screen.getByTestId('interior-backdrop').querySelector('img')!
    expect(image.width).toBe(1536)
    expect(image.height).toBe(1152)
    expect(observe).toHaveBeenCalled()

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 768,
      height: 576,
    } as DOMRect)
    act(() => window.dispatchEvent(new Event('resize')))
    expect(image.width).toBe(768)
    expect(image.height).toBe(576)

    vi.stubGlobal('innerWidth', 360)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 360,
      height: 222,
    } as DOMRect)
    act(() => window.dispatchEvent(new Event('resize')))
    expect(image.width).toBe(768)
    expect(image.height).toBe(576)
    unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })
})

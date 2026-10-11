import { useLayoutEffect, useRef, useState } from 'react'
import type { LocationId } from '@/core/contracts'
import { interiors } from '@/content/interiors'
import { useReducedMotion } from './UiRoot'
import styles from './InteriorBackdrop.module.css'

export function InteriorBackdrop({
  location,
  src: srcProp,
}: {
  location: LocationId
  src?: string
}) {
  const src = srcProp ?? interiors[location]
  const reducedMotion = useReducedMotion()
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const element = frame.current
    if (!element) return
    const measure = () => {
      const { width, height } = element.getBoundingClientRect()
      const phone = window.innerWidth < 768
      // Cover the central phone band or desktop viewport using whole pixel-art scales.
      setScale(
        Math.max(
          1,
          phone
            ? Math.ceil(Math.max(width / 384, height / 128))
            : Math.ceil(Math.max(width / 384, height / 288)),
        ),
      )
    }
    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [src])

  if (!src) return null

  return (
    <div
      ref={frame}
      className={styles.frame}
      data-testid="interior-backdrop"
      data-reduced-motion={String(reducedMotion)}
      aria-hidden="true"
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        width={384 * scale}
        height={288 * scale}
        decoding="async"
      />
    </div>
  )
}

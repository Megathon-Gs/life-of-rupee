import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { world } from '@/content/world'
import { BUILDING_HEIGHT, GROUND_Y, type PixiWorldRenderer } from '@/world'
import { stageMetrics } from './stage'
import styles from './App.module.css'

/** Logical px the label sits below the sprite's top edge, where the facades' transparent headroom ends. */
const LABEL_DROP = 32

export interface LocationLabelsProps {
  /** Null until the renderer is ready; labels stay hidden until then. */
  renderer: PixiWorldRenderer | null
  /** True while a panel is open: the band is inert, so the labels go too. */
  hidden: boolean
}

/**
 * One DOM label per location, above its building. The text comes from i18n, never from the
 * art. Positions follow the street layer's whole-pixel offset, so they track the camera.
 */
export function LocationLabels({ renderer, hidden }: LocationLabelsProps) {
  const { t } = useTranslation('world')
  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<Array<HTMLLIElement | null>>([])

  useEffect(() => {
    const list = listRef.current
    if (!renderer || !list || hidden) return
    let frame = 0
    const place = () => {
      const band = list.parentElement
      if (band) {
        const { unit, offsetY } = stageMetrics(band)
        const streetX = renderer.layerContainers.street.x
        world.locations.forEach((location, i) => {
          const item = itemRefs.current[i]
          if (!item) return
          const x = (location.x + streetX) * unit
          const y = offsetY + (GROUND_Y - BUILDING_HEIGHT + LABEL_DROP) * unit
          item.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
        })
      }
      frame = requestAnimationFrame(place)
    }
    place()
    return () => cancelAnimationFrame(frame)
  }, [renderer, hidden])

  return (
    <ul ref={listRef} className={styles.labels} hidden={hidden || !renderer}>
      {world.locations.map((location, i) => (
        <li
          key={location.id}
          ref={(el) => {
            itemRefs.current[i] = el
          }}
          className={styles.label}
          data-testid={`label-${location.id}`}
        >
          {t(location.labelKey)}
        </li>
      ))}
    </ul>
  )
}

import { useLayoutEffect, useRef, useState } from 'react'
import { WORLD, integerWorldScale } from '../tokens'
import sceneUrl from '../../../art/bible/reference/scene-a-world.png'
import protagonistUrl from '../../../art/bible/reference/cand-a-protagonist.png'
import styles from './WorldBand.module.css'

/**
 * Dev-only stand-in for the Pixi world: the P0-03 Direction A reference scene
 * (art/bible/reference, read-only) cropped at 1:1 logical pixels and scaled by
 * whole numbers only. The gallery shows the UI over real art; the shipped game
 * draws its world with Pixi from art/approved once P0-19 lands.
 */
const SCENE_WIDTH = 1280
/** Logical x of the bank's centre in the reference scene. */
const FOCUS_X = 120
/** Sprite feet sit at y=232 on the pavement (art bible §2); the sprite is 32×48. */
const PROTAGONIST = { x: FOCUS_X + 24, y: 232 - 48 }

const load = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })

export function WorldBand() {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [view, setView] = useState<{ scale: number; width: number }>({ scale: 1, width: WORLD.width })

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const update = () => {
      const scale = integerWorldScale(Infinity, box.clientHeight)
      // Show as many whole logical pixels as the box holds at this scale.
      setView({ scale, width: Math.min(SCENE_WIDTH, Math.ceil(box.clientWidth / scale)) })
    }
    update()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(box)
    return () => observer?.disconnect()
  }, [])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    let cancelled = false
    const sourceX = Math.max(0, Math.min(SCENE_WIDTH - view.width, FOCUS_X - Math.floor(view.width / 2)))
    g.imageSmoothingEnabled = false
    g.fillStyle = '#9fd3e6'
    g.fillRect(0, 0, canvas.width, canvas.height)
    Promise.all([load(sceneUrl), load(protagonistUrl)])
      .then(([scene, protagonist]) => {
        if (cancelled) return
        g.drawImage(scene, sourceX, 0, view.width, WORLD.height, 0, 0, view.width, WORLD.height)
        g.drawImage(protagonist, PROTAGONIST.x - sourceX, PROTAGONIST.y)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [view])

  return (
    <div ref={boxRef} className={styles.box} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={view.width}
        height={WORLD.height}
        style={{ width: view.width * view.scale, height: WORLD.height * view.scale }}
        data-world-scale={view.scale}
      />
    </div>
  )
}

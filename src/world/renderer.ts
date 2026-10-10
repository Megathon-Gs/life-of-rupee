import gsap from 'gsap'
import { Application, Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import type {
  LocationDef,
  LocationId,
  WorldDef,
  WorldRenderer,
  WorldVisuals,
} from '@/core/contracts'
import { bandHeight, logicalWidth, LOGICAL_HEIGHT, scaleFor } from './scale'
import {
  BUILDING_HEIGHT,
  BUILDING_WIDTH,
  GreyboxTextureProvider,
  GROUND_Y,
  LAYERS,
  PROTAGONIST_HEIGHT,
  PROTAGONIST_WIDTH,
  type LayerName,
  type ProtagonistState,
  type TextureProvider,
} from './textures'

/** Beyond this many building hops the protagonist runs instead of walking. */
export const RUN_HOP_THRESHOLD = 2
/** Reduced-motion travel cross-fade in milliseconds. */
export const REDUCED_MOTION_MS = 150

/** Travel duration in ms: scales with distance, clamped 0.7–1.1 s; 150 ms when reduced. */
export function travelDurationMs(hops: number, reducedMotion: boolean): number {
  if (reducedMotion) return REDUCED_MOTION_MS
  const seconds = Math.min(1.1, Math.max(0.7, 0.5 + Math.abs(hops) * 0.2))
  return Math.round(seconds * 1000)
}

/** Protagonist state for a travel of `hops` buildings. */
export function travelState(hops: number): ProtagonistState {
  return Math.abs(hops) > RUN_HOP_THRESHOLD ? 'run' : 'walk'
}

export interface WorldRendererOptions {
  world: WorldDef
  textures?: TextureProvider
  /** Deterministic mode: manual ticker stepping and `travelTo` jumps to its end state. */
  test?: boolean
  /** No Pixi Application or WebGL at all (unit tests). */
  headless?: boolean
  /** Viewport override in device pixels, used in headless mode. */
  viewport?: { width: number; height: number; dpr?: number }
}

/**
 * PixiJS greybox implementation of the frozen `WorldRenderer` contract. It holds
 * no text and no rules — only the stage, parallax layers and the protagonist.
 */
export class PixiWorldRenderer implements WorldRenderer {
  /** Layer containers, exposed so tests can read their rounded offsets. */
  readonly layerContainers: Record<LayerName, Container> = {} as Record<LayerName, Container>

  /** Exposed for tests that check facing and arrival position. */
  get protagonistSprite(): Sprite {
    return this.protagonist
  }

  private readonly world: WorldDef
  private readonly textures: TextureProvider
  private readonly headless: boolean
  private readonly test: boolean
  private readonly viewportOverride?: { width: number; height: number; dpr?: number }

  private readonly worldRoot = new Container()
  private readonly background = new Graphics()
  private readonly tiles = new Map<LayerName, TilingSprite>()
  private readonly buildings = new Map<string, Sprite>()
  private readonly protagonist = new Sprite()
  private readonly doorLight = new Graphics()

  private app?: Application
  private el?: HTMLElement
  private scale = 1
  private logicalViewportWidth = 240
  private worldWidth = 0
  private cameraX = 0
  private protagonistX = 0
  private currentIndex = 0
  private visuals: WorldVisuals = {}
  private paused = false
  private clock = 0
  private arriveCbs: Array<(id: LocationId) => void> = []
  private readonly ready: Promise<void>
  private resolveReady: () => void = () => {}

  constructor(options: WorldRendererOptions) {
    this.world = options.world
    this.textures = options.textures ?? new GreyboxTextureProvider()
    this.test = options.test ?? false
    this.headless = options.headless ?? false
    this.viewportOverride = options.viewport

    for (const layer of LAYERS) {
      const container = new Container()
      container.label = layer.name
      const tile = new TilingSprite({
        texture: this.textures.layer(layer.name),
        width: 1,
        height: LOGICAL_HEIGHT,
      })
      container.addChild(tile)
      this.tiles.set(layer.name, tile)
      this.layerContainers[layer.name] = container
      this.worldRoot.addChild(container)
    }

    this.protagonist.anchor.set(0.5, 1)
    this.doorLight.alpha = 0
    this.worldRoot.addChild(this.doorLight)
    this.worldRoot.addChild(this.protagonist)

    for (const location of this.world.locations) {
      const sprite = new Sprite()
      sprite.label = location.id
      sprite.anchor.set(0.5, 1)
      sprite.x = location.x
      sprite.y = GROUND_Y
      sprite.width = BUILDING_WIDTH
      sprite.height = BUILDING_HEIGHT
      this.buildings.set(location.id, sprite)
      this.layerContainers.street.addChild(sprite)
    }

    this.worldWidth = Math.max(...this.world.locations.map((l) => l.x)) + 200
    this.ready = new Promise<void>((resolve) => (this.resolveReady = resolve))
    this.applyBuildings()
    this.protagonistX = this.world.locations[0]!.doorX
    this.currentIndex = 0
    if (this.viewportOverride) this.setViewport(this.viewportOverride)
  }

  mount(el: unknown): void {
    this.el = el as HTMLElement
    if (this.headless) {
      this.resolveReady()
      return
    }
    const app = new Application()
    this.app = app
    const { width, height } = this.el.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    void app
      .init({
        width: Math.max(1, Math.round(width * dpr)),
        height: Math.max(1, Math.round(height * dpr)),
        backgroundColor: this.textures.sky,
        antialias: false,
        resolution: 1,
        autoStart: !this.test,
        preference: 'webgl',
      })
      .then(() => {
        if (this.app !== app) return
        this.el!.appendChild(app.canvas)
        app.stage.addChild(this.background, this.worldRoot)
        this.setViewport({
          width: this.el!.clientWidth,
          height: this.el!.clientHeight,
          dpr: window.devicePixelRatio || 1,
        })
        this.resolveReady()
      })
    if (!this.test) document.addEventListener('visibilitychange', this.onVisibilityChange)
  }

  /** Resolves once the Pixi Application has initialised (or immediately in headless mode). */
  whenReady(): Promise<void> {
    return this.ready
  }

  resize(): void {
    if (this.headless || !this.el || !this.app) return
    const dpr = window.devicePixelRatio || 1
    this.setViewport({ width: this.el.clientWidth, height: this.el.clientHeight, dpr })
  }

  async travelTo(id: LocationId, opts: { reducedMotion: boolean }): Promise<void> {
    const target = this.world.locations.findIndex((l) => l.id === id)
    if (target < 0) throw new Error(`Unknown location: ${id}`)
    const from = this.currentIndex
    const hops = Math.abs(target - from)
    const destination = this.world.locations[target]!
    this.protagonist.scale.x = destination.doorX < this.protagonistX ? -1 : 1
    const state = travelState(hops)
    this.setState(state)

    if (this.test || hops === 0) {
      this.protagonistX = destination.doorX
      this.currentIndex = target
      this.updateCamera()
      this.finishTravel(destination.id, 'arrive')
      return
    }

    const duration = travelDurationMs(hops, opts.reducedMotion) / 1000

    if (opts.reducedMotion) {
      this.protagonistX = destination.doorX
      this.currentIndex = target
      this.updateCamera()
      this.protagonist.alpha = 0
      await this.tween(
        { value: 0 },
        { value: 1, duration, onUpdate: (value) => (this.protagonist.alpha = value) },
      )
      this.finishTravel(destination.id, 'arrive')
      return
    }

    await this.tween(
      { value: this.protagonistX },
      {
        value: destination.doorX,
        duration,
        onUpdate: (value) => {
          this.protagonistX = value
          this.updateCamera()
        },
      },
    )
    this.currentIndex = target
    this.updateCamera()
    this.finishTravel(destination.id, 'arrive')
  }

  applyVisuals(v: WorldVisuals): void {
    const changed = this.world.locations.filter(
      (location) => (this.visuals[location.id] ?? '') !== (v[location.id] ?? ''),
    )
    this.visuals = { ...v }
    for (const location of changed) this.applyBuilding(location)
  }

  onArrive(cb: (id: LocationId) => void): void {
    this.arriveCbs.push(cb)
  }

  /** Ease the camera toward the entrance before showing the lesson; reverse on exit. */
  async transitionLocation(
    id: LocationId,
    reducedMotion: boolean,
    reverse = false,
    signal?: AbortSignal,
  ): Promise<void> {
    if (signal?.aborted) return
    if (reducedMotion) {
      if (reverse) {
        this.doorLight.alpha = 0
        this.updateCamera()
        if (this.test) this.step(0)
      }
      return
    }
    const location = this.world.locations.find((item) => item.id === id)
    if (!location) return
    const center = this.clampCamera(this.protagonistX - this.logicalViewportWidth / 2)
    const entrance = this.clampCamera(location.doorX - this.logicalViewportWidth * 0.38)
    this.setState('idle')
    this.doorLight.clear().ellipse(0, 0, 18, 45).fill({ color: 0xffdc82 })
    this.doorLight.y = GROUND_Y - BUILDING_HEIGHT * 0.25
    if (this.test) {
      this.cameraX = reverse ? center : entrance
      this.doorLight.alpha = reverse ? 0 : 0.55
      this.updateCameraLayers()
      this.step(0)
      return
    }
    await Promise.all([
      this.tween(
        { value: this.cameraX },
        {
          value: reverse ? center : entrance,
          duration: 0.3,
          onUpdate: (value) => {
            this.cameraX = value
            this.updateCameraLayers()
          },
        },
        signal,
      ),
      this.tween(
        { value: this.doorLight.alpha },
        {
          value: reverse ? 0 : 0.55,
          duration: 0.3,
          onUpdate: (value) => {
            this.doorLight.alpha = value
          },
        },
        signal,
      ),
    ])
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    if (!this.app) return
    if (paused) this.app.ticker.stop()
    else this.app.ticker.start()
  }

  /** Manually advance the render in test mode (deterministic stepping). */
  step(deltaMs: number): void {
    this.clock += deltaMs
    gsap.updateRoot(this.clock / 1000)
    this.app?.renderer.render(this.app.stage)
  }

  destroy(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.arriveCbs = []
    if (this.app) {
      this.app.ticker.stop()
      this.app.destroy({ removeView: true }, { children: true })
      this.app = undefined
    }
    this.el = undefined
  }

  private setViewport(viewport: { width: number; height: number; dpr?: number }): void {
    const dpr = viewport.dpr ?? 1
    const deviceWidth = Math.max(1, Math.round(viewport.width * dpr))
    const deviceHeight = Math.max(1, Math.round(viewport.height * dpr))
    this.scale = scaleFor(bandHeight({ width: deviceWidth, height: deviceHeight }))
    this.logicalViewportWidth = logicalWidth(deviceWidth, this.scale)

    this.app?.renderer.resize(deviceWidth, deviceHeight)
    this.worldRoot.scale.set(this.scale)
    this.layoutLayers()
    this.updateCamera()
    this.drawBackground(deviceWidth, deviceHeight)
  }

  private layoutLayers(): void {
    const maxCamera = Math.max(0, this.worldWidth - this.logicalViewportWidth)
    for (const layer of LAYERS) {
      const tile = this.tiles.get(layer.name)!
      tile.width = maxCamera * layer.factor + this.logicalViewportWidth + 64
      tile.height = LOGICAL_HEIGHT
      tile.texture = this.textures.layer(layer.name)
    }
    this.protagonist.texture = this.textures.protagonist('idle')
    this.protagonist.width = PROTAGONIST_WIDTH
    this.protagonist.height = PROTAGONIST_HEIGHT
    this.protagonist.y = GROUND_Y
  }

  private drawBackground(deviceWidth: number, deviceHeight: number): void {
    const groundY = Math.round(GROUND_Y * this.scale)
    this.background
      .clear()
      .rect(0, groundY, deviceWidth, Math.max(0, deviceHeight - groundY))
      .fill(this.textures.pavement)
  }

  private updateCamera(): void {
    this.cameraX = this.clampCamera(this.protagonistX - this.logicalViewportWidth / 2)
    this.updateCameraLayers()
  }

  private clampCamera(value: number): number {
    return Math.min(Math.max(0, this.worldWidth - this.logicalViewportWidth), Math.max(0, value))
  }

  private updateCameraLayers(): void {
    for (const layer of LAYERS) {
      this.layerContainers[layer.name].x = -Math.round(this.cameraX * layer.factor)
    }
    this.protagonist.x = Math.round(this.protagonistX - this.cameraX)
    this.doorLight.x = Math.round(this.protagonistX - this.cameraX)
  }

  private setState(state: ProtagonistState): void {
    this.protagonist.texture = this.textures.protagonist(state)
  }

  private finishTravel(id: LocationId, state: ProtagonistState): void {
    this.doorLight.alpha = 0
    this.setState(state)
    this.protagonist.alpha = 1
    for (const cb of this.arriveCbs) cb(id)
  }

  private applyBuildings(): void {
    for (const location of this.world.locations) this.applyBuilding(location)
  }

  private applyBuilding(location: LocationDef): void {
    const sprite = this.buildings.get(location.id)
    if (!sprite) return
    const { texture, tint } = this.textures.building(location, this.visuals)
    sprite.texture = texture
    sprite.tint = tint
  }

  private tween(
    from: { value: number },
    opts: { value: number; duration: number; onUpdate: (value: number) => void },
    signal?: AbortSignal,
  ): Promise<void> {
    return new Promise((resolve) => {
      const proxy = { ...from }
      const cancel = () => {
        animation.kill()
        resolve()
      }
      const animation = gsap.to(proxy, {
        value: opts.value,
        duration: opts.duration,
        ease: 'power1.inOut',
        onUpdate: () => opts.onUpdate(proxy.value),
        onComplete: () => {
          signal?.removeEventListener('abort', cancel)
          opts.onUpdate(opts.value)
          resolve()
        },
      })
      signal?.addEventListener('abort', cancel, { once: true })
    })
  }

  private onVisibilityChange = (): void => {
    if (this.paused || !this.app) return
    if (document.hidden) this.app.ticker.stop()
    else this.app.ticker.start()
  }
}

import { GREYBOX_WORLD, PixiWorldRenderer } from '..'

const test = new URLSearchParams(location.search).get('test') === '1'
const worldEl = document.getElementById('world')
if (!worldEl) throw new Error('#world not found')

const renderer = new PixiWorldRenderer({ world: GREYBOX_WORLD, test })
renderer.mount(worldEl)
window.addEventListener('resize', () => renderer.resize())

const ids = GREYBOX_WORLD.locations.map((l) => l.id)
let index = 0
async function go(delta: number) {
  index = Math.min(ids.length - 1, Math.max(0, index + delta))
  await renderer.travelTo(ids[index]!, { reducedMotion: false })
  if (test) renderer.step(0)
}
document.getElementById('prev')?.addEventListener('click', () => void go(-1))
document.getElementById('next')?.addEventListener('click', () => void go(1))

let upgraded = false
document.getElementById('visuals')?.addEventListener('click', () => {
  upgraded = !upgraded
  renderer.applyVisuals(upgraded ? { bank: 'greets', clinic: 'upgraded' } : {})
  if (test) renderer.step(0)
})

void renderer.whenReady().then(() => {
  renderer.resize()
  if (test) renderer.step(0)
  ;(window as unknown as { __world?: unknown }).__world = { renderer, ready: true }
})

// assetpack build CLI (P0-13). Packs art/approved/ into one atlas PNG per district
// under public/assets/ and writes a manifest with content-hashed file names.
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import sharp from 'sharp'
import { findPngs } from '../asset-lint/lint'

export interface BuildOptions {
  path: string
  out: string
  /** Atlas shelf width target; a single wider sprite simply overflows. */
  maxWidth?: number
}

interface Frame {
  x: number
  y: number
  w: number
  h: number
  baseline: Array<{ opaque: number; facade: number }>
}

interface Sprite {
  name: string
  file: string
  w: number
  h: number
  frameWidth: number
  frameHeight: number
  pixels: Buffer
}

interface District {
  atlas: string
  width: number
  height: number
  frames: Record<string, Frame>
}

/** Pack a district's sprites into one shelf-packed atlas image. */
async function packDistrict(
  sprites: Sprite[],
  maxWidth: number,
): Promise<{ png: Buffer; district: Omit<District, 'atlas'> }> {
  const ordered = [...sprites].sort((a, b) => b.h - a.h || a.name.localeCompare(b.name))
  let shelfY = 0
  let shelfHeight = 0
  let x = 0
  const placed = ordered.map((sprite) => {
    if (x > 0 && x + sprite.w > maxWidth) {
      shelfY += shelfHeight
      shelfHeight = 0
      x = 0
    }
    const at = { ...sprite, x, y: shelfY }
    x += sprite.w
    if (sprite.h > shelfHeight) shelfHeight = sprite.h
    return at
  })

  const width = Math.max(1, ...placed.map((p) => p.x + p.w))
  const height = Math.max(1, shelfY + shelfHeight)
  const composites = await Promise.all(
    placed.map(async (p) => ({
      input: await sharp(p.file).ensureAlpha().png().toBuffer(),
      left: p.x,
      top: p.y,
    })),
  )
  const png = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer()

  const frames: Record<string, Frame> = {}
  for (const p of placed) {
    const baseline = []
    for (let x = 0; x < p.w; x += p.frameWidth) {
      let opaque = -1
      let facade = -1
      for (let y = p.h - 1; y >= 0; y -= 1) {
        let filled = 0
        for (let col = x; col < Math.min(x + p.frameWidth, p.w); col += 1) {
          if (p.pixels[(y * p.w + col) * 4 + 3] > 0) filled += 1
        }
        if (opaque < 0 && filled > 0) opaque = y + 1
        if (facade < 0 && filled >= Math.ceil(p.frameWidth * 0.25)) facade = y + 1
        if (opaque >= 0 && facade >= 0) break
      }
      baseline.push({
        opaque: opaque < 0 ? p.frameHeight : opaque,
        facade: facade < 0 ? p.frameHeight : facade,
      })
    }
    frames[p.name] = { x: p.x, y: p.y, w: p.w, h: p.h, baseline }
  }
  return { png, district: { width, height, frames } }
}

export async function buildAtlases(
  opts: BuildOptions,
): Promise<{ manifest: string; districts: string[] }> {
  const { path, out, maxWidth = 2048 } = opts
  const root = resolve(path)
  const outDir = resolve(out)

  const byDistrict = new Map<string, Sprite[]>()
  for (const file of await findPngs(root)) {
    const rel = relative(root, file)
    const district = dirname(rel) === '.' ? 'default' : rel.split(sep)[0]
    const meta = await sharp(file).metadata()
    const sidecar = JSON.parse(
      await readFile(file.replace(/\.png$/i, '.json'), 'utf8').catch(() => '{}'),
    ) as {
      frameSize?: number[]
    }
    if (
      sidecar.frameSize &&
      (sidecar.frameSize.length !== 2 ||
        !sidecar.frameSize.every((size) => Number.isInteger(size) && size > 0) ||
        (meta.width ?? 0) % sidecar.frameSize[0]! !== 0 ||
        (meta.height ?? 0) % sidecar.frameSize[1]! !== 0)
    ) {
      throw new Error(`Invalid frameSize in ${file.replace(/\.png$/i, '.json')}`)
    }
    const frameWidth = sidecar.frameSize?.[0] ?? meta.width ?? 0
    const frameHeight = sidecar.frameSize?.[1] ?? meta.height ?? 0
    const pixels = await sharp(file).ensureAlpha().raw().toBuffer()
    const list = byDistrict.get(district) ?? []
    list.push({
      name: basename(file, '.png'),
      file,
      w: meta.width ?? 0,
      h: meta.height ?? 0,
      frameWidth,
      frameHeight,
      pixels,
    })
    byDistrict.set(district, list)
  }

  await mkdir(outDir, { recursive: true })
  const districts: Record<string, District> = {}
  for (const [district, sprites] of [...byDistrict].sort(([a], [b]) => a.localeCompare(b))) {
    const { png, district: packed } = await packDistrict(sprites, maxWidth)
    const hash = createHash('sha256').update(png).digest('hex').slice(0, 8)
    const atlas = `${district}.${hash}.png`
    await writeFile(join(outDir, atlas), png)
    districts[district] = { atlas, ...packed }
  }

  const manifest = JSON.stringify({ version: 1, districts }, null, 2)
  await writeFile(join(outDir, 'manifest.json'), manifest)
  return { manifest: join(outDir, 'manifest.json'), districts: Object.keys(districts) }
}

function parseArgs(argv: string[]): BuildOptions {
  const opts: BuildOptions = { path: 'art/approved', out: 'public/assets' }
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split('=')
    const next = () => inline ?? argv[++i]
    if (flag === '--path') opts.path = next()
    else if (flag === '--out') opts.out = next()
    else if (flag === '--max-width') opts.maxWidth = Number(next())
  }
  return opts
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  if (!existsSync(resolve(opts.path))) {
    console.log(`assetpack: no assets under ${opts.path}`)
    return
  }
  const { manifest, districts } = await buildAtlases(opts)
  console.log(`assetpack: ${districts.length} district atlas(es) → ${manifest}`)
}

// Only run the CLI when executed directly, not when imported by a test.
if (process.argv[1]?.endsWith('build.ts')) void main()

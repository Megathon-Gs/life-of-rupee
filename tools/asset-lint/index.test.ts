import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { lintDirectory, parsePalette, type LintReport, type Rule } from './lint'

type RGBA = [number, number, number, number]
const RED: RGBA = [255, 0, 0, 255]
const BLUE: RGBA = [0, 0, 255, 255]
const MAGENTA: RGBA = [255, 0, 255, 255]
const CLEAR: RGBA = [0, 0, 0, 0]

function raw(width: number, height: number, fill: (x: number, y: number) => RGBA): Buffer {
  const buf = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fill(x, y)
      const i = (y * width + x) * 4
      buf[i] = r
      buf[i + 1] = g
      buf[i + 2] = b
      buf[i + 3] = a
    }
  }
  return buf
}

async function writePng(
  dir: string,
  name: string,
  width: number,
  height: number,
  pixel: (x: number, y: number) => RGBA,
) {
  await mkdir(dir, { recursive: true })
  await sharp(raw(width, height, pixel), { raw: { width, height, channels: 4 } })
    .png()
    .toFile(join(dir, name))
}

async function writeSidecar(dir: string, name: string, sidecar: Record<string, unknown> | null) {
  await writeFile(
    join(dir, name.replace(/\.png$/, '.json')),
    sidecar === null ? '{}' : JSON.stringify(sidecar),
  )
}

const LICENSED = {
  tool: 'test',
  toolVersion: '1',
  prompt: 'fixture',
  referenceIds: [],
  licence: 'CC0',
  date: '2026-10-10',
}

const rules = (report: LintReport): Rule[] => report.issues.map((i) => i.rule)

let dir: string
let palette: Set<string>

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'asset-lint-'))
  palette = parsePalette(
    await readFile(join(process.cwd(), 'tools/asset-lint/fixtures/palette.json'), 'utf8'),
  )
})

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

const lint = (sub: string) => lintDirectory({ path: join(dir, sub), palette })

describe('asset-lint', () => {
  it('passes a valid opaque on-grid tile', async () => {
    const sub = 'pass-tile'
    const nested = join(dir, sub)
    await writePng(nested, 'tile.png', 16, 16, () => RED)
    await writeSidecar(nested, 'tile.png', { ...LICENSED, kind: 'tile' })
    const report = await lint(sub)
    expect(report.ok).toBe(true)
    expect(report.checked).toBe(1)
  })

  it('passes a valid repeat-x tile whose edges match', async () => {
    const sub = 'pass-repeat'
    const nested = join(dir, sub)
    await writePng(nested, 'grass.png', 16, 16, () => RED)
    await writeSidecar(nested, 'grass.png', { ...LICENSED, kind: 'tile', tags: ['repeat-x'] })
    expect((await lint(sub)).ok).toBe(true)
  })

  it('passes a valid sheet with aligned frames', async () => {
    const sub = 'pass-sheet'
    const nested = join(dir, sub)
    await writePng(nested, 'walk.png', 32, 16, (x, y) => (y <= 4 ? RED : CLEAR))
    await writeSidecar(nested, 'walk.png', { ...LICENSED, kind: 'sheet', frameSize: [16, 16] })
    expect((await lint(sub)).ok).toBe(true)
  })

  it('fails off-grid tile dimensions', async () => {
    const sub = 'fail-grid'
    const nested = join(dir, sub)
    await writePng(nested, 'tile.png', 17, 16, () => RED)
    await writeSidecar(nested, 'tile.png', { ...LICENSED, kind: 'tile' })
    expect(rules(await lint(sub))).toContain('grid')
  })

  it('fails semi-transparent pixels', async () => {
    const sub = 'fail-alpha'
    const nested = join(dir, sub)
    await writePng(nested, 'tile.png', 16, 16, (x, y) =>
      x === 0 && y === 0 ? [255, 0, 0, 128] : RED,
    )
    await writeSidecar(nested, 'tile.png', { ...LICENSED, kind: 'tile' })
    expect(rules(await lint(sub))).toContain('alpha')
  })

  it('fails colours outside the palette', async () => {
    const sub = 'fail-palette'
    const nested = join(dir, sub)
    await writePng(nested, 'tile.png', 16, 16, () => MAGENTA)
    await writeSidecar(nested, 'tile.png', { ...LICENSED, kind: 'tile' })
    expect(rules(await lint(sub))).toContain('palette')
  })

  it('fails a repeat-x tile with a seam', async () => {
    const sub = 'fail-seams'
    const nested = join(dir, sub)
    await writePng(nested, 'grass.png', 16, 16, (x) => (x === 15 ? BLUE : RED))
    await writeSidecar(nested, 'grass.png', { ...LICENSED, kind: 'tile', tags: ['repeat-x'] })
    expect(rules(await lint(sub))).toContain('seams')
  })

  it('fails frame drift greater than 1px', async () => {
    const sub = 'fail-frames'
    const nested = join(dir, sub)
    await writePng(nested, 'walk.png', 32, 16, (x, y) => {
      const limit = x < 16 ? 4 : 7
      return y <= limit ? RED : CLEAR
    })
    await writeSidecar(nested, 'walk.png', { ...LICENSED, kind: 'sheet', frameSize: [16, 16] })
    expect(rules(await lint(sub))).toContain('frames')
  })

  it('fails a sidecar without a licence', async () => {
    const sub = 'fail-licence'
    const nested = join(dir, sub)
    await writePng(nested, 'tile.png', 16, 16, () => RED)
    await writeSidecar(nested, 'tile.png', { ...LICENSED, licence: '' })
    expect(rules(await lint(sub))).toContain('licence')
  })

  it('fails a missing sidecar', async () => {
    const sub = 'fail-nosidecar'
    const nested = join(dir, sub)
    await writePng(nested, 'tile.png', 16, 16, () => RED)
    expect(rules(await lint(sub))).toContain('licence')
  })

  it('reports an empty directory as clean', async () => {
    const report = await lint('empty')
    expect(report).toMatchObject({ checked: 0, ok: true })
  })
})

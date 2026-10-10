import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildAtlases } from './build'

async function solid(path: string, width: number, height: number) {
  await mkdir(join(path, '..'), { recursive: true })
  await sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 255 } },
  })
    .png()
    .toFile(path)
}

let root: string
let approved: string

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'assetpack-'))
  approved = join(root, 'approved')
  await solid(join(approved, 'urban', 'home.png'), 16, 16)
  await solid(join(approved, 'urban', 'bank.png'), 16, 32)
  await solid(join(approved, 'rural', 'tree.png'), 16, 16)
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('assetpack build', () => {
  it('writes per-district atlases and a content-hashed manifest', async () => {
    const out = join(root, 'assets')
    await buildAtlases({ path: approved, out, maxWidth: 64 })
    const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))

    expect(Object.keys(manifest.districts).sort()).toEqual(['rural', 'urban'])
    const urban = manifest.districts.urban
    expect(urban.atlas).toMatch(/^urban\.[0-9a-f]{8}\.png$/)
    expect(existsSync(join(out, urban.atlas))).toBe(true)
    expect(Object.keys(urban.frames).sort()).toEqual(['bank', 'home'])
    // Taller sprite packs first; both fit on one 64px shelf.
    expect(urban.frames.bank).toEqual({ x: 0, y: 0, w: 16, h: 32 })
    expect(urban.frames.home).toEqual({ x: 16, y: 0, w: 16, h: 16 })
  })

  it('is deterministic for the same input', async () => {
    const outA = join(root, 'a')
    const outB = join(root, 'b')
    await buildAtlases({ path: approved, out: outA, maxWidth: 64 })
    await buildAtlases({ path: approved, out: outB, maxWidth: 64 })
    expect(await readFile(join(outA, 'manifest.json'), 'utf8')).toBe(
      await readFile(join(outB, 'manifest.json'), 'utf8'),
    )
  })
})

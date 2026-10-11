import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
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
  await solid(join(approved, 'interiors', 'bank.png'), 16, 16)
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('assetpack build', () => {
  it('writes per-district atlases and a content-hashed manifest', async () => {
    const out = join(root, 'assets')
    await buildAtlases({ path: approved, out, maxWidth: 64 })
    const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))

    // Interiors are standalone backdrops, so they never get an atlas.
    expect(Object.keys(manifest.districts).sort()).toEqual(['rural', 'urban'])
    const urban = manifest.districts.urban
    expect(urban.atlas).toMatch(/^urban\.[0-9a-f]{8}\.png$/)
    expect(existsSync(join(out, urban.atlas))).toBe(true)
    expect(Object.keys(urban.frames).sort()).toEqual(['bank', 'home'])
    // Taller sprite packs first; both fit on one 64px shelf.
    expect(urban.frames.bank).toMatchObject({
      x: 0,
      y: 0,
      w: 16,
      h: 32,
      baseline: [{ opaque: 32, facade: 32 }],
    })
    expect(urban.frames.home).toMatchObject({
      x: 16,
      y: 0,
      w: 16,
      h: 16,
      baseline: [{ opaque: 16, facade: 16 }],
    })
  })

  it('records opaque and facade baselines for each sheet frame', async () => {
    const sprite = join(approved, 'urban', 'padded.png')
    const pixels = Buffer.alloc(32 * 16 * 4)
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 32; x++) pixels[(y * 32 + x) * 4 + 3] = 255
    }
    pixels[(15 * 32 + 16) * 4 + 3] = 255
    await sharp(pixels, { raw: { width: 32, height: 16, channels: 4 } })
      .png()
      .toFile(sprite)
    await writeFile(sprite.replace(/\.png$/, '.json'), JSON.stringify({ frameSize: [16, 16] }))
    const out = join(root, 'baseline')
    await buildAtlases({ path: approved, out, maxWidth: 64 })
    const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))
    expect(manifest.districts.urban.frames.padded.baseline).toEqual([
      { opaque: 15, facade: 15 },
      { opaque: 16, facade: 15 },
    ])
  })

  it('rejects invalid frame dimensions instead of looping while packing', async () => {
    const invalidApproved = join(root, 'invalid-approved')
    const sprite = join(invalidApproved, 'urban', 'invalid.png')
    await solid(sprite, 16, 16)
    await writeFile(sprite.replace(/\.png$/, '.json'), JSON.stringify({ frameSize: [0, 16] }))
    await expect(
      buildAtlases({ path: invalidApproved, out: join(root, 'invalid') }),
    ).rejects.toThrow('Invalid frameSize')
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

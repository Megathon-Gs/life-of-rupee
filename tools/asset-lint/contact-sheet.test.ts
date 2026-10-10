import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { renderContactSheet } from './contact-sheet'

let root: string

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'contact-sheet-'))
  const assets = join(root, 'assets')
  await mkdir(assets, { recursive: true })
  await sharp({
    create: { width: 16, height: 16, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 255 } },
  })
    .png()
    .toFile(join(assets, 'a.png'))
  await sharp({
    create: { width: 32, height: 16, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 255 } },
  })
    .png()
    .toFile(join(assets, 'b.png'))
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('contact-sheet', () => {
  it('renders assets onto one PNG at phone scale', async () => {
    const out = join(root, 'sheet.png')
    const { count } = await renderContactSheet({
      path: join(root, 'assets'),
      out,
      scale: 3,
      cols: 2,
      padding: 8,
    })
    expect(count).toBe(2)
    const meta = await sharp(out).metadata()
    // cellWidth = 32×3 = 96, rowHeight = 16×3 = 48
    expect(meta.width).toBe(8 + 2 * (96 + 8))
    expect(meta.height).toBe(8 + 48 + 8)
  })

  it('throws when there are no assets', async () => {
    await expect(
      renderContactSheet({ path: join(root, 'missing'), out: join(root, 'x.png') }),
    ).rejects.toThrow()
  })
})

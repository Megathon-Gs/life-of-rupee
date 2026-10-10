// contact-sheet CLI (P0-13). Renders a folder of assets onto one PNG at phone
// scale so a human can sign off the look in a single image.
import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import sharp from 'sharp'
import { findPngs } from './lint'

export interface ContactSheetOptions {
  path: string
  out: string
  /** Whole-number zoom, matching the world renderer's integer scaling. */
  scale?: number
  cols?: number
  padding?: number
  background?: string
}

/** Composite every PNG under `path` into a grid and write it to `out`. */
export async function renderContactSheet(
  opts: ContactSheetOptions,
): Promise<{ out: string; count: number }> {
  const { out, scale = 3, cols = 6, padding = 8, background = '#202020' } = opts
  const files = await findPngs(resolve(opts.path))
  if (files.length === 0) throw new Error(`contact-sheet: no assets under ${opts.path}`)

  const sprites = await Promise.all(
    files.map(async (file) => {
      const meta = await sharp(file).metadata()
      const width = (meta.width ?? 0) * scale
      const height = (meta.height ?? 0) * scale
      return {
        width,
        height,
        input: await sharp(file).resize(width, height, { kernel: 'nearest' }).png().toBuffer(),
      }
    }),
  )

  const gridCols = Math.max(1, cols)
  const gridRows = Math.ceil(sprites.length / gridCols)
  const cellWidth = Math.max(...sprites.map((s) => s.width))
  const rowHeights = Array.from({ length: gridRows }, (_, r) =>
    Math.max(...sprites.slice(r * gridCols, r * gridCols + gridCols).map((s) => s.height)),
  )

  const rowTops: number[] = []
  let y = padding
  for (const rowHeight of rowHeights) {
    rowTops.push(y)
    y += rowHeight + padding
  }
  const width = padding + gridCols * (cellWidth + padding)
  const height = y

  const cells = sprites.map((sprite, i) => ({
    input: sprite.input,
    left: padding + (i % gridCols) * (cellWidth + padding),
    top: rowTops[Math.floor(i / gridCols)],
  }))

  await sharp({ create: { width, height, channels: 4, background } })
    .composite(cells)
    .png()
    .toFile(resolve(out))

  return { out, count: files.length }
}

function parseArgs(argv: string[]): ContactSheetOptions {
  const opts: ContactSheetOptions = { path: 'art/approved', out: 'contact-sheet.png' }
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split('=')
    const next = () => inline ?? argv[++i]
    if (flag === '--path') opts.path = next()
    else if (flag === '--out') opts.out = next()
    else if (flag === '--scale') opts.scale = Number(next())
    else if (flag === '--cols') opts.cols = Number(next())
  }
  return opts
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  if (!existsSync(resolve(opts.path))) {
    console.error(`contact-sheet: no assets under ${opts.path}`)
    process.exitCode = 1
    return
  }
  const { out, count } = await renderContactSheet(opts)
  console.log(`contact-sheet: ${count} asset(s) → ${basename(out)}`)
}

// Only run the CLI when executed directly, not when imported by a test.
if (process.argv[1]?.endsWith('contact-sheet.ts')) void main()

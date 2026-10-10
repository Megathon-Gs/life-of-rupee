// Core asset linter. Exported separately from index.ts so it can be unit tested
// without spawning the CLI. Every rule from the P0-13 brief lives here.
import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import sharp from 'sharp'

export const RULES = ['grid', 'alpha', 'palette', 'seams', 'frames', 'licence'] as const
export type Rule = (typeof RULES)[number]

export interface Issue {
  file: string
  rule: Rule
  message: string
}

export interface FileResult {
  file: string
  ok: boolean
  issues: Issue[]
}

export interface LintReport {
  checked: number
  passed: number
  failed: number
  ok: boolean
  files: FileResult[]
  issues: Issue[]
}

/** Sidecar written next to each PNG (`foo.png` → `foo.json`). */
export interface Sidecar {
  tool?: string
  toolVersion?: string
  prompt?: string
  referenceIds?: string[]
  licence?: string
  date?: string
  kind?: 'tile' | 'sheet'
  tags?: string[]
  frameSize?: number[]
}

export interface LintOptions {
  path: string
  palette: Set<string>
  /** Directory used to shorten paths in the report. */
  root?: string
}

const GRID = 16

/** `#rrggbb` (or `#rrggbbaa`) → "r,g,b", or null when unparseable. */
export function parseHex(hex: string): string | null {
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(h)) return null
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',')
}

/** Accepts `["#rrggbb", ...]` or `{ "colors": [...] }`. */
export function parsePalette(text: string): Set<string> {
  const data: unknown = JSON.parse(text)
  const colors = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { colors?: unknown }).colors)
      ? (data as { colors: unknown[] }).colors
      : null
  if (!colors) throw new Error('palette.json must be an array of hex colours or { colors: [...] }')
  const set = new Set<string>()
  for (const entry of colors) {
    if (typeof entry !== 'string') continue
    const rgb = parseHex(entry)
    if (rgb) set.add(rgb)
  }
  if (set.size === 0) throw new Error('palette.json has no valid hex colours')
  return set
}

/** Every `.png` under `dir`, recursively, sorted for determinism. Missing dir → []. */
export async function findPngs(dir: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const out: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await findPngs(path)))
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.png') out.push(path)
  }
  return out.sort()
}

async function readSidecar(png: string): Promise<{ sidecar: Sidecar | null; error?: string }> {
  const sidecarPath = `${png.slice(0, -4)}.json`
  try {
    return { sidecar: JSON.parse(await readFile(sidecarPath, 'utf8')) as Sidecar }
  } catch (err) {
    return { sidecar: null, error: (err as Error).message }
  }
}

function rgbToHex(key: string): string {
  const [r, g, b] = key.split(',').map(Number)
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export async function lintFile(png: string, opts: LintOptions): Promise<FileResult> {
  const file = opts.root ? relative(opts.root, png) : png
  const issues: Issue[] = []
  const add = (rule: Rule, message: string) => issues.push({ file, rule, message })

  const { sidecar, error } = await readSidecar(png)
  const meta = await sharp(png).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0

  const frameSize =
    Array.isArray(sidecar?.frameSize) &&
    sidecar.frameSize.length === 2 &&
    sidecar.frameSize.every((n) => typeof n === 'number' && n > 0)
      ? (sidecar.frameSize as [number, number])
      : null
  const isSheet = sidecar?.kind === 'sheet' || frameSize !== null
  const tags = Array.isArray(sidecar?.tags) ? sidecar.tags : []

  // licence — a sidecar that is missing entirely is a missing licence too.
  if (!sidecar || typeof sidecar.licence !== 'string' || sidecar.licence.trim() === '') {
    add(
      'licence',
      sidecar ? 'sidecar missing "licence"' : `sidecar not found${error ? ` (${error})` : ''}`,
    )
  }

  // grid (tiles) / equal frame size (sheets).
  if (isSheet) {
    if (!frameSize) add('grid', 'sheet sidecar missing numeric frameSize [w, h]')
    else {
      const [fw, fh] = frameSize
      if (width % fw !== 0 || height % fh !== 0) {
        add('grid', `sheet ${width}×${height} is not an even multiple of frame ${fw}×${fh}`)
      }
    }
  } else if (width % GRID !== 0 || height % GRID !== 0) {
    add('grid', `${width}×${height} is not on the ${GRID}px grid`)
  }

  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const channels = info.channels

  // alpha (0 or 255 only) and palette (opaque pixels only).
  const badAlpha = new Set<number>()
  const badColors = new Map<string, number>()
  for (let i = 0; i < data.length; i += channels) {
    const alpha = data[i + 3]
    if (alpha !== 0 && alpha !== 255) badAlpha.add(alpha)
    else if (alpha === 255) {
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`
      if (!opts.palette.has(key)) badColors.set(key, (badColors.get(key) ?? 0) + 1)
    }
  }
  if (badAlpha.size > 0) {
    add(
      'alpha',
      `semi-transparent alpha ${[...badAlpha].sort((a, b) => a - b).join(', ')} (must be 0 or 255)`,
    )
  }
  if (badColors.size > 0) {
    const listed = [...badColors.keys()].slice(0, 8).map(rgbToHex)
    const extra = badColors.size > 8 ? ` (+${badColors.size - 8} more)` : ''
    add('palette', `colours not in palette: ${listed.join(', ')}${extra}`)
  }

  // seams — a repeat-x tile must wrap: left edge column == right edge column.
  if (tags.includes('repeat-x') && width > 1) {
    for (let y = 0; y < height; y++) {
      const row = y * width * channels
      for (let c = 0; c < channels; c++) {
        if (data[row + c] !== data[row + (width - 1) * channels + c]) {
          add('seams', 'repeat-x left and right edge columns differ')
          y = height
          break
        }
      }
    }
  }

  // frames — feet baseline / opaque body height must not drift > 1 px across frames.
  if (isSheet && frameSize) {
    const [fw, fh] = frameSize
    const cols = Math.floor(width / fw)
    const rows = Math.floor(height / fh)
    const baselines: number[] = []
    const heights: number[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let minY = Infinity
        let maxY = -1
        for (let y = 0; y < fh; y++) {
          for (let x = 0; x < fw; x++) {
            const alpha = data[((r * fh + y) * width + (c * fw + x)) * channels + 3]
            if (alpha === 255) {
              if (y < minY) minY = y
              if (y > maxY) maxY = y
            }
          }
        }
        if (maxY >= 0) {
          baselines.push(maxY)
          heights.push(maxY - minY + 1)
        }
      }
    }
    if (baselines.length > 1) {
      const baselineDrift = Math.max(...baselines) - Math.min(...baselines)
      const heightDrift = Math.max(...heights) - Math.min(...heights)
      if (baselineDrift > 1 || heightDrift > 1) {
        add(
          'frames',
          `frame drift > 1px (baseline ${baselineDrift}px, opaque height ${heightDrift}px)`,
        )
      }
    }
  }

  issues.sort((a, b) => RULES.indexOf(a.rule) - RULES.indexOf(b.rule))
  return { file, ok: issues.length === 0, issues }
}

export async function lintDirectory(opts: LintOptions): Promise<LintReport> {
  const pngs = await findPngs(opts.path)
  const files = await Promise.all(pngs.map((png) => lintFile(png, opts)))
  const failed = files.filter((f) => !f.ok).length
  return {
    checked: files.length,
    passed: files.length - failed,
    failed,
    ok: failed === 0,
    files,
    issues: files.flatMap((f) => f.issues),
  }
}

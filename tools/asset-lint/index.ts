// asset-lint CLI (P0-13). `pnpm lint:assets` → checks art/approved/ against the
// art bible palette and fails on any rule violation. Use `--path` to lint raw.
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { findPngs, lintDirectory, parsePalette, type LintReport } from './lint'

interface Args {
  path: string
  palette: string
  json: boolean
  help: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    path: 'art/approved',
    palette: 'art/bible/palette.json',
    json: false,
    help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split('=')
    const next = () => inline ?? argv[++i]
    if (flag === '--path') args.path = next()
    else if (flag === '--palette') args.palette = next()
    else if (flag === '--json') args.json = true
    else if (flag === '--help' || flag === '-h') args.help = true
  }
  return args
}

function printReport(report: LintReport): void {
  if (report.ok) {
    console.log(`asset-lint: all ${report.checked} asset(s) passed`)
    return
  }
  console.log(
    `asset-lint: ${report.checked} checked, ${report.passed} passed, ${report.failed} failed`,
  )
  for (const file of report.files) {
    if (file.ok) continue
    console.log(`  FAIL ${file.file}`)
    for (const issue of file.issues) console.log(`    [${issue.rule}] ${issue.message}`)
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log('Usage: tsx tools/asset-lint/index.ts [--path <dir>] [--palette <file>] [--json]')
    return
  }

  const dir = resolve(args.path)
  if (!existsSync(dir) || (await findPngs(dir)).length === 0) {
    console.log(`asset-lint: no assets under ${args.path}`)
    return
  }

  let palette
  try {
    palette = parsePalette(await readFile(resolve(args.palette), 'utf8'))
  } catch (err) {
    console.error(`asset-lint: cannot read palette ${args.palette}: ${(err as Error).message}`)
    process.exitCode = 1
    return
  }

  const report = await lintDirectory({ path: dir, palette, root: dir })
  if (args.json) console.log(JSON.stringify(report, null, 2))
  else printReport(report)
  if (!report.ok) process.exitCode = 1
}

void main()

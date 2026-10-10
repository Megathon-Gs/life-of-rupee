import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, relative, dirname, basename } from 'node:path'
import { pathToFileURL } from 'node:url'
import { LevelDefSchema, SourceDefSchema, type SourceDef } from '../../src/core/contracts/content'

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }
type Issue = { message: string }

export function flattenStrings(value: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  if (typeof value === 'string') out.set(prefix, value)
  else if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key
      for (const [nested, text] of flattenStrings(child, path)) out.set(nested, text)
    }
  }
  return out
}

export function checkLevel(level: unknown, id: string, sources: Set<string>, locales: Record<string, Record<string, Set<string>>>): Issue[] {
  const issues: Issue[] = []
  if (!level || typeof level !== 'object' || !('claims' in level) || !Array.isArray(level.claims)) {
    const parsed = LevelDefSchema.safeParse(level)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      issues.push({ message: `${id}: invalid level at ${issue?.path.join('.') || 'root'}: ${issue?.message ?? 'invalid data'}` })
    }
    return issues
  }

  for (const [index, claim] of level.claims.entries()) {
    if (!claim || typeof claim !== 'object') continue
    const item = typeof claim.textKey === 'string' ? claim.textKey : `claim-${index + 1}`
    const sourceIds = Array.isArray(claim.sourceIds) ? claim.sourceIds : []
    if (!sourceIds.length) issues.push({ message: `${id}: claim '${item}' has no sources` })
    for (const sourceId of sourceIds) if (!sources.has(String(sourceId))) {
      issues.push({ message: `${id}: claim '${item}' has unknown source '${String(sourceId)}'` })
    }
    if (typeof claim.reviewerRole !== 'string' || !claim.reviewerRole || typeof claim.reviewedOn !== 'string' || !claim.reviewedOn) {
      issues.push({ message: `${id}: claim '${item}' has no review stamp` })
    }
    for (const lang of ['en', 'te']) {
      if (!hasTextKey(locales[lang] ?? {}, String(claim.textKey ?? ''), id)) {
        issues.push({ message: `${id}: claim '${item}' textKey missing in ${lang}` })
      }
    }
  }
  const parsed = LevelDefSchema.safeParse(level)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    issues.push({ message: `${id}: invalid level at ${issue?.path.join('.') || 'root'}: ${issue?.message ?? 'invalid data'}` })
  }
  return issues
}

function hasTextKey(namespaces: Record<string, Set<string>>, key: string, levelId: string): boolean {
  const colon = key.indexOf(':')
  const namespace = colon >= 0 ? key.slice(0, colon) : /^l\d{2}/.exec(levelId)?.[0] ?? levelId
  const localizedKey = colon >= 0
    ? key.slice(colon + 1)
    : key.startsWith(`${namespace}.`) ? key.slice(namespace.length + 1) : key
  return namespaces[namespace]?.has(localizedKey) ?? false
}

async function filesBelow(path: string, predicate: (file: string) => boolean): Promise<string[]> {
  let entries
  try { entries = await readdir(path, { withFileTypes: true }) } catch { return [] }
  const files = await Promise.all(entries.map(async entry => {
    const file = resolve(path, entry.name)
    return entry.isDirectory() ? filesBelow(file, predicate) : predicate(file) ? [file] : []
  }))
  return files.flat()
}

async function importDefault(file: string): Promise<unknown> {
  const module = await import(pathToFileURL(file).href) as { default?: unknown; level?: unknown; sources?: unknown }
  return module.default ?? module.level ?? module.sources ?? []
}

export async function lintContent(root = process.cwd()): Promise<string[]> {
  const content = resolve(root, 'src/content')
  const sourceRegistry: SourceDef[] = []
  const globalSourceFile = resolve(content, 'sources.ts')
  try {
    const value = await importDefault(globalSourceFile)
    if (Array.isArray(value)) sourceRegistry.push(...value as SourceDef[])
  } catch (error) {
    return [`sources.ts: could not load registry (${String(error)})`]
  }
  const sourceIds = new Set<string>()
  const issues: string[] = []
  for (const source of sourceRegistry) {
    const parsed = SourceDefSchema.safeParse(source)
    if (!parsed.success) issues.push(`sources.ts: invalid source '${String((source as { id?: unknown })?.id)}'`)
    else sourceIds.add(parsed.data.id)
  }

  const localeRoot = resolve(content, 'locales')
  const locales: Record<string, Record<string, Map<string, string>>> = { en: {}, te: {} }
  for (const lang of ['en', 'te']) {
    for (const file of await filesBelow(resolve(localeRoot, lang), file => file.endsWith('.json'))) {
      try { locales[lang][basename(file, '.json')] = flattenStrings(JSON.parse(await readFile(file, 'utf8'))) }
      catch (error) { issues.push(`${relative(root, file)}: invalid JSON (${String(error)})`) }
    }
  }
  for (const [namespace, english] of Object.entries(locales.en)) {
    const telugu = locales.te[namespace]
    for (const key of english.keys()) if (!telugu?.has(key)) issues.push(`${namespace}: key '${key}' missing in te`)
  }
  const keySets = Object.fromEntries(['en', 'te'].map(lang => [
    lang,
    Object.fromEntries(Object.entries(locales[lang]).map(([namespace, strings]) => [namespace, new Set(strings.keys())])),
  ])) as Record<string, Record<string, Set<string>>>

  const levelFiles = await filesBelow(resolve(content, 'levels'), file => /(?:^|\/)(?:level|[^/]+\.level)\.ts$/.test(file))
  const loadedLevels: { file: string; level: { id?: unknown } | null; id: string }[] = []
  for (const file of levelFiles) {
    const level = await importDefault(file) as { id?: unknown; claims?: unknown } | null
    const id = typeof level?.id === 'string' ? level.id : relative(resolve(content, 'levels'), dirname(file))
    loadedLevels.push({ file, level, id })
    const levelSourcesFile = resolve(dirname(file), 'sources.ts')
    if (await filesBelow(dirname(file), candidate => candidate === levelSourcesFile).then(files => files.length)) {
      try {
        const local = await importDefault(levelSourcesFile)
        if (Array.isArray(local)) for (const source of local) {
          const parsed = SourceDefSchema.safeParse(source)
          if (parsed.success) sourceIds.add(parsed.data.id)
          else issues.push(`${id}: invalid local source`)
        }
      } catch (error) { issues.push(`${id}: could not load sources (${String(error)})`) }
    }
  }
  for (const { level, id } of loadedLevels) {
    issues.push(...checkLevel(level, id, sourceIds, keySets).map(issue => issue.message))
  }

  return issues
}

export async function pseudoLocale(root: string): Promise<void> {
  const locales = resolve(root, 'src/content/locales/en')
  const output = resolve(root, 'src/content/locales/pseudo')
  for (const file of await filesBelow(locales, file => file.endsWith('.json'))) {
    const data = JSON.parse(await readFile(file, 'utf8')) as Json
    const pad = (value: Json): Json => typeof value === 'string'
      ? `［${value}${'~'.repeat(Math.ceil(value.length * 0.4))}］`
      : Array.isArray(value) ? value.map(pad)
        : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, pad(item)]))
          : value
    const destination = resolve(output, relative(locales, file))
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, `${JSON.stringify(pad(data), null, 2)}\n`)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = process.cwd()
  if (process.argv.includes('--pseudo')) await pseudoLocale(root)
  else {
    const issues = await lintContent(root)
    if (issues.length) {
      console.error(issues.join('\n'))
      process.exitCode = 1
    } else console.log('content-lint: passed')
  }
}

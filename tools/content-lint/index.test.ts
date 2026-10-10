import { describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkLevel, flattenStrings, pseudoLocale } from './index'

const validLevel = {
  id: 'l99-fixture',
  skillNodes: ['fixture'],
  location: 'bank',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['fixture.title'] },
    { id: 'lesson', type: 'lesson', interaction: 'formFiller', config: {} },
    { id: 'travel', type: 'travel', location: 'bank' },
    { id: 'decision', type: 'decision', interaction: 'formFiller', config: {}, rubric: { minorPenalty: 1, majorPenalty: 2, criticalCap: 1, transferCap: 2 } },
    { id: 'outcome', type: 'consequence', outcomeKeys: ['fixture.outcome'], explanationKey: 'fixture.explanation' },
    { id: 'transfer', type: 'transfer', variants: [{ id: 'a', interaction: 'formFiller', config: {} }] },
  ],
  worldEffects: [],
  claims: [{ textKey: 'fixture.claim', sourceIds: ['rbi'], reviewerRole: 'educator', reviewedOn: '2026-10-10' }],
}

describe('content lint checks', () => {
  it('flags missing and unknown sources, review stamps, and missing translated claim keys', () => {
    const level = structuredClone(validLevel)
    level.claims = [
      { textKey: 'x.y', sourceIds: [], reviewerRole: '', reviewedOn: '' },
      { textKey: 'x.z', sourceIds: ['unknown'], reviewerRole: 'educator', reviewedOn: '2026-10-10' },
    ]
    const issues = checkLevel(level, 'l99', new Set(['rbi']), {
      en: { l99: new Set(['x.y', 'x.z']) },
      te: { l99: new Set(['x.y']) },
    })
    expect(issues.map(issue => issue.message)).toContain("l99: claim 'x.y' has no sources")
    expect(issues.map(issue => issue.message)).toContain("l99: claim 'x.z' has unknown source 'unknown'")
    expect(issues.map(issue => issue.message)).toContain("l99: claim 'x.y' has no review stamp")
    expect(issues.map(issue => issue.message)).toContain("l99: claim 'x.z' textKey missing in te")
  })

  it('flattens nested locale keys for coverage checks', () => {
    expect([...flattenStrings({ a: { b: 'text' } }).keys()]).toEqual(['a.b'])
  })

  it('names the invalid level field in schema errors', () => {
    const level = structuredClone(validLevel)
    level.steps[0].type = 'invalid'
    const issues = checkLevel(level, 'l99', new Set(['rbi']), { en: {}, te: {} })
    expect(issues.map(issue => issue.message).join('\n')).toContain('l99: invalid level at steps.0.type:')
  })

  it('writes pseudo-locales with 40% string padding', async () => {
    const root = await mkdtemp(join(tmpdir(), 'content-lint-'))
    try {
      const english = join(root, 'src/content/locales/en')
      await mkdir(english, { recursive: true })
      await writeFile(join(english, 'common.json'), JSON.stringify({ greeting: 'Hello' }))
      await pseudoLocale(root)
      expect(JSON.parse(await readFile(join(root, 'src/content/locales/pseudo/common.json'), 'utf8')))
        .toEqual({ greeting: '［Hello~~］' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

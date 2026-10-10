# Task brief: Content lint, sources registry and i18n

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-12 · Depends on: P0-04

## Target
`tools/content-lint/**`, `src/content/sources.ts`, `src/i18n/**`, `src/content/locales/en/common.json`, `src/content/locales/te/common.json`

## Change
- `src/i18n/` — i18next + ICU init; loads every namespace file found by `import.meta.glob('src/content/locales/*/*.json')` (`common`, task namespaces such as `ui`, and one per level); language switch; in dev, a missing Telugu key renders the English text with a visible marker.
- `src/content/sources.ts` — global registry of `SourceDef`s for RBI, NPCI, SEBI and NCFE landing pages, each with `retrievedOn`. Per-level sources live in `src/content/levels/<id>/sources.ts`; the linter merges both.
- `tools/content-lint/index.ts` (replaces the P0-01 stub) — fails with a message naming the level and item when: a level fails its schema; a claim has no `sourceIds`, an unknown source ID, or no `reviewerRole`/`reviewedOn`; a `textKey` is missing in `en` or `te`; any key in `en/*.json` has no counterpart in the same `te` file.
- A pseudo-locale generator (`pnpm lint:content --pseudo`) writing strings padded by 40% for layout tests.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Content, language and accuracy
- Do-not-touch: `src/core/contracts/**`, `src/content/levels/**`, `package.json`
- Allowed dependencies: i18next, react-i18next, i18next-icu, intl-messageformat, tsx (installed)
- Non-goals: no level content; no translations beyond `common`

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm lint:content` passes on the repo
- [ ] Fixture level with a claim lacking sources → exit 1, message `l99: claim 'x.y' has no sources`
- [ ] Fixture with a key missing in `te` → exit 1 naming the key
- [ ] Fixture with an unknown source ID → exit 1
- [ ] `pnpm test src/i18n` passes: switching to `te` changes rendered text; missing key falls back to English

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

# Task brief: Asset lint and atlas build

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-13 · Depends on: P0-01

## Target
`tools/asset-lint/**`, `tools/assetpack/**`, `art/README.md`

## Change
- `tools/asset-lint/index.ts` (replaces the stub) — checks every PNG under `art/approved/` (and `--path` for `art/raw/`) using sharp. Fails on: dimensions off the 16 px grid (tiles) or unequal frame size (sheets, frame size from sidecar); any alpha other than 0 or 255; any colour not in `art/bible/palette.json`; tiles tagged `repeat-x` whose left and right edge columns differ; sheets whose feet baseline or opaque height drift > 1 px across frames; sidecar missing `licence`. Output: a human-readable report plus `--json`.
- `tools/assetpack/build.ts` (replaces the stub) — packs `art/approved/` into per-district atlases in `public/assets/` with a content-hashed `manifest.json`.
- `tools/asset-lint/contact-sheet.ts` — renders a list of assets onto one PNG at phone scale for human review.
- `art/README.md` — folder rules (raw → lint → approved), sidecar format.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Asset pipeline
- Do-not-touch: `art/bible/**`, `art/raw/**`, `art/approved/**`, `src/**`, `package.json`
- Allowed dependencies: sharp, @assetpack/core, tsx (installed)
- Non-goals: no asset generation. Until P0-03 lands, test against a fixture palette in `tools/asset-lint/fixtures/`

## Ownership
- You may edit: `tools/asset-lint/**`, `tools/assetpack/**`, `art/README.md`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test tools/asset-lint` passes with one passing fixture and one failing fixture per rule (6 rules)
- [ ] `pnpm lint:assets` exits 0 when `art/approved/` is empty
- [ ] `pnpm build:assets` on fixture assets produces `public/assets/manifest.json` with hashed file names

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

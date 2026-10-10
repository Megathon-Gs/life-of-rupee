# Task brief: World content and world visuals

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-17 · Depends on: P0-04

## Target
`src/content/world.ts`, `src/content/skillTree.ts`, `src/core/worldVisuals/**`, `src/content/locales/{en,te}/world.json`

## Change
- `world.ts` — the P0 street as a `WorldDef` with location IDs `home`, `bank`, `kirana`, `filler-1`, `filler-2`, running urban → rural-connected, with snap `x` positions on the 16 px grid, `doorX`, district tags and `labelKey`s.
- `skillTree.ts` — the 5 branches from product plan §7 (Money Management, Financial Access, Financial Safety, Borrowing & Responsibilities, Understanding Growth & Economy) with nodes mapped to the 12 levels and edges between them.
- `worldVisuals/derive.ts` — `deriveWorldVisuals(derived): WorldVisuals`. P0 rule: world flag `bank.accountOpened` = `'true'` → bank teller variant `greets`. Pure function.

New strings go in the `world` namespace only (English + a Telugu draft marked `needsReview`); never edit another namespace.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § World renderer ("world change is derived"), `docs/product-plan.md` §7, §8
- Do-not-touch: `src/core/contracts/**`, `src/world/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no rendering; no levels; no P1 locations

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/core/worldVisuals src/content` passes
- [ ] `world.ts` and `skillTree.ts` validate against their schemas; snap positions are strictly increasing multiples of 16
- [ ] Fresh derived state → teller `default`; `worldFlags['bank.accountOpened'] === 'true'` → teller `greets`
- [ ] Every level 1–12 maps to at least one skill node

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

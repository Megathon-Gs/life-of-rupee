# Task brief: ScenarioChain interaction

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-06 · Depends on: P2-01

## Target
`src/ui/interactions/ScenarioChain/**`, `src/content/locales/{en,te}/scenarioChain.json`

## Change
- Runs several kit components in sequence from a `ScenarioChainConfig`, passing `carry` values (e.g. money left after a budget) from one link to the next, with a progress strip showing the links. Emits each child's events unchanged, tagged with the link index in `stepId`.
- Children are looked up through the interactions registry interface; tests use stub components so this task does not wait for P2-03 to P2-05.
- Same event contract and conventions as the P0/P1 interactions: `choice`/`hint`/`explanationOpened` events with configured error category and severity; "Simulated — never enter real details" banner; two hint levels; renders in `PanelShell`; tokens from P0-11; 360 px wide works.
- Do **not** register it in `src/ui/interactions/index.ts` (P2-25 does).

New strings go in the `scenarioChain` namespace only (English + a Telugu draft marked `needsReview`); never edit `common.json`.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §5, §6, §11, §12; `docs/technical-implementation-plan.md` § Level runner and content model
- Do-not-touch: other interactions, `src/ui/interactions/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no free-text inputs; no level content

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/interactions/ScenarioChain` passes:
  - a 3-link chain of stubs completes in order and calls `onComplete` once
  - a carried value from link 1 appears in link 2's config
  - a child's error event is re-emitted with `stepId` `<step>.<linkIndex>`
  - resuming at link 2 does not replay link 1's events
- [ ] No `<input type="text">`, `<textarea>` or `contenteditable` rendered
- [ ] axe 0 violations; targets ≥ 44×44 CSS px; fully keyboard-operable

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

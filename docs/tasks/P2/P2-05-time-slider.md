# Task brief: TimeSlider interaction

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-05 · Depends on: P2-01

## Target
`src/ui/interactions/TimeSlider/**`, `src/content/locales/{en,te}/timeSlider.json`

## Change
- A slider (and step buttons) moves time forward year by year; a chart and a short line of plain text show savings growth (Level 3), a basket's price rising (Level 7) or an illustrative range of outcomes (Level 11). The student then answers the question in config.
- Every rate is labelled "Assumption: …"; ranges for Level 11 are shown as ranges, never a single promised number.
- Same event contract and conventions as the P0/P1 interactions: `choice`/`hint`/`explanationOpened` events with configured error category and severity; "Simulated — never enter real details" banner; two hint levels; renders in `PanelShell`; tokens from P0-11; 360 px wide works.
- Do **not** register it in `src/ui/interactions/index.ts` (P2-25 does).

New strings go in the `timeSlider` namespace only (English + a Telugu draft marked `needsReview`); never edit `common.json`.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §5, §6, §11, §12; `docs/technical-implementation-plan.md` § Level runner and content model
- Do-not-touch: other interactions, `src/ui/interactions/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no free-text inputs; no level content

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/interactions/TimeSlider` passes:
  - choosing the higher nominal amount when the question is about purchasing power → `inflation.nominal_vs_real`
  - choosing the locked deposit when the case needs money in 3 months → `saving.ignored_liquidity`
  - correct answer → `choice` correct and `onComplete`
  - reduced motion: the chart updates without animation
- [ ] No `<input type="text">`, `<textarea>` or `contenteditable` rendered
- [ ] axe 0 violations; targets ≥ 44×44 CSS px; fully keyboard-operable

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

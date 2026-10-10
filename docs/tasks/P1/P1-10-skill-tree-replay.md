# Task brief: Full skill tree and replay-to-improve

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-10 · Depends on: P1-01

## Target
`src/ui/screens/SkillTree/**`, `src/ui/screens/Results/**`, `src/content/locales/{en,te}/skilltree.json`

## Change
- Skill tree: illustrated 5-branch layout; completed nodes lit and connected to earlier ones; next available node previewed; each node shows best stars; tapping a completed node offers Replay; tapping a locked node says what unlocks it.
- Results: after a replay, show "Best: ★★★ (first try ★★)" and the improvement; review items link to the relevant skill node; unlock animation lights the branch (instant with reduced motion).

New strings go in the `skilltree` namespace only (English + a Telugu draft marked `needsReview`); never edit `common.json`.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §7
- Do-not-touch: other UI folders, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no leaderboards or comparisons with other students; no wealth display

## Ownership
- You may edit: `src/ui/screens/SkillTree/**`, `src/ui/screens/Results/**`, `src/content/locales/{en,te}/skilltree.json`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/screens` passes
- [ ] Fixture with Level 2 at best 3 / first 2 → results show both; skill node shows 3 stars
- [ ] Locked node announces its unlock condition to screen readers
- [ ] axe 0 violations; works at 360 px and with keyboard only

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

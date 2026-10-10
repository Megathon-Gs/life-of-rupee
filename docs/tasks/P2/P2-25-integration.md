# Task brief: P2 integration — the full twelve-level journey

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-25 · Depends on: P2-03 to P2-24

## Target
`src/content/world.ts`, `src/content/skillTree.ts` (node mapping only), `src/content/levels/index.ts`, `src/ui/interactions/index.ts`, `src/app/**`, `src/world/**` (district wiring), `src/transitions/**`, `public/assets/**`, `tests/e2e/p2/**`, `src/content/levels/l09/level.ts` (one world choice only)

## Change
- Add the `high-street` and `rural-connected` districts and the `market`, `workplace`, `insurance-desk` and `learning-centre` locations to `world.ts` with `unlockedBy`; rebuild atlases with `pnpm build:assets`.
- Register BudgetAllocator, ReceiptInspector, TimeSlider, ScenarioChain and Levels 1, 3, 6, 7, 8, 10, 11, 12.
- Level 9: record `loan.activeInstallment: 'true'` as a world choice when the player takes a loan; no other edit to Level 9.
- Wire P2-18 visuals to sprites; wire sync (P2-20), the consent screen (P2-22) and the `/educator` route (P2-21) into the app; apply P2-23's PWA config.
- Transitions for the new interactions following product plan §5 (receipt slides up, time-lapse for TimeSlider).
- CSP `connect-src` allows only the app origin and the sync origin.
- E2E per new level on all 3 projects: clean path 3 stars, scripted mistake 2 stars, review item shown; installment pressure appears in Level 6 only after Level 9's loan choice; capstone opens only after Level 12; reload keeps everything.

## Constraints
- Read and follow: AGENTS.md, SPEC.md (§10 G2), `docs/technical-implementation-plan.md` § Implementation phases
- Do-not-touch: component and level internals (file bugs on their cards), `package.json`
- Allowed dependencies: none new
- Non-goals: no postgame scenarios; no AI

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm e2e` green on all 3 projects, including `tests/e2e/p2/**`, the P1 suite and the unchanged P0 demo journey
- [ ] Lighthouse budgets and FPS probe still pass with all districts present
- [ ] Network allowlist test: consent not granted → only the app origin; granted → app and sync origins only
- [ ] All 12 levels completable in order from a fresh profile (one long e2e, test mode)

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated

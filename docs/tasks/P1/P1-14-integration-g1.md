# Task brief: P1 integration and gate G1 ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-14 · Depends on: P1-02 to P1-12 (P1-13 if done) · Gate: NGO educator plays the P1 build

## Target
`src/content/world.ts`, `src/content/levels/index.ts`, `src/ui/interactions/index.ts`, `src/app/**`, `src/transitions/**` (phone emerge + offer fan-out), `public/assets/**`, `tests/e2e/p1/**`

## Change
- Add `phone-shop`, `showroom` and `capstone` locations to `world.ts`; rebuild atlases with `pnpm build:assets`.
- Register UpiPayment, MessageTriage, OfferComparator and Levels 4, 5, 9.
- Wire the skill tree, replay, capstone flag and teacher summary into the app.
- Transitions: phone emerges into the UPI panel; offer cards fan out (product plan §5).
- E2E per level on all 3 projects: clean path 3 stars, scripted mistake 2 stars, review item shown; the Level 9 fraud callback appears only after Level 5; reload keeps everything.

## Constraints
- Read and follow: AGENTS.md, SPEC.md (G1 acceptance), `docs/technical-implementation-plan.md` § Implementation phases
- Do-not-touch: component and level internals (file bugs on their cards), `package.json`
- Allowed dependencies: none new
- Non-goals: no P2 levels; no sync

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm e2e` green on all 3 projects, including `tests/e2e/p1/**` and the unchanged P0 demo journey
- [ ] Lighthouse budgets and FPS probe still pass
- [ ] Network allowlist test passes on every P1 screen
- [ ] ⛩ G1: NGO educator plays Levels 2, 4, 5, 9 and signs off accuracy; recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] G1 signed · [ ] comment+status updated

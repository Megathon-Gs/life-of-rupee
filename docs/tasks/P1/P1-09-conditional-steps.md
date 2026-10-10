# Task brief: Conditional steps and world memory

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-09 · Depends on: P1-01

## Target
`src/level-runner/**`, `src/core/worldVisuals/**`

## Change
- Level runner: evaluate the optional `when` condition on each step against derived world flags passed to `start`/`resume`; skipped steps leave no events. The condition result is fixed at level start so a resumed level behaves the same.
- World visuals: new P1 flags → visuals — phone shop lit after Level 4 is available; shopkeeper recognises the player after Level 5; showroom lit after Level 5; capstone exterior visible (locked) when `features.capstone` is on.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §8, `docs/technical-implementation-plan.md` § Level runner, § World renderer
- Do-not-touch: `src/core/contracts/**`, `src/ui/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no new levels; no randomness in consequences

## Ownership
- You may edit: `src/level-runner/**`, `src/core/worldVisuals/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/level-runner src/core/worldVisuals` passes, with all P0 tests unchanged
- [ ] Fixture level with a `when` step: flag true → step shown; flag false → skipped; resume mid-level keeps the start-time decision
- [ ] Each new flag maps to its visual variant; fresh state is unchanged from P0

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

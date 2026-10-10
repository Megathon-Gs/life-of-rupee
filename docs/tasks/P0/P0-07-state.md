# Task brief: Game state — reducer, derive, merge, migrations

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-07 · Depends on: P0-04

## Target
`src/core/state/**`

## Change
- `actions.ts` + `reducer.ts` — pure reducer over `SaveFile`: `profileCreated`, `travelled`, `levelStarted`, `eventRecorded`, `stepAdvanced`, `attemptCompleted`, `settingsUpdated`, `transitionSeen`. Time and IDs arrive in action payloads; the reducer never reads clocks or randomness.
- `derive.ts` — `derive(save, content): Derived`: best and first stars per level, completed skills, unlocked locations, world flags and fictional wallet replayed from `worldChoices` in attempt order.
- `merge.ts` — `merge(a, b)`: union of attempts by ID, settings by latest `updatedAt`, position from the save with the latest attempt.
- `migrations/` — numbered migration runner with a v1 baseline and fixture saves.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Game state and persistence
- Do-not-touch: `src/core/contracts/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no storage I/O (P0-08); no world visuals (P0-17)

## Ownership
- You may edit: `src/core/state/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/core/state` passes
- [ ] Attempts on one level with 2 then 3 stars → `bestStars` 3, `firstStars` 2
- [ ] Property: `merge` is commutative, associative and idempotent on attempts
- [ ] Property: reducer is pure (same state + action → deep-equal result; input not mutated)
- [ ] `migrate(v1Fixture)` passes the `SaveFile` schema
- [ ] A save from an older schema version with no migration path throws a typed `MigrationError`

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

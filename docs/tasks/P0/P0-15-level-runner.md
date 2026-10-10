# Task brief: Level runner

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-15 · Depends on: P0-04, P0-06

## Target
`src/level-runner/**`

## Change
Implement `LevelRunner`:
- `start(level, seed, now)` walks Hook → Lesson → Travel → Decision → Consequence → Transfer. `current()` exposes the active step and what the UI must render (dialogue, interaction ID + config, required location).
- `dispatch(event)` records `InteractionEvent`s and advances when a step completes. The Travel step completes only on an `arrivedAt(locationId)` event that matches the level's location.
- Transfer step: picks one variant from the pool with a seeded PRNG (seed injected, no `Math.random`).
- On completion: calls `score()` from `src/core/scoring` and emits an `AttemptRecord` (ID, times and seed injected).
- `snapshot()` / `resume(snapshot)` round-trip mid-level state (`inLevel` in `SaveFile`).

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Level runner and content model
- Do-not-touch: `src/core/**`, `src/ui/**`, `package.json`
- Allowed dependencies: none new. No imports from react, pixi.js or the DOM.
- Non-goals: no rendering; no persistence calls (the app saves)

## Ownership
- You may edit: `src/level-runner/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/level-runner` passes using a fixture level
- [ ] A scripted run with one minor mistake produces an `AttemptRecord` whose stars equal `score()` on the same events (2)
- [ ] Snapshot taken mid-Decision → `resume` continues at the same step with the same events
- [ ] Same seed → same transfer variant; different seeds cover all variants across 100 seeds
- [ ] `arrivedAt` with the wrong location does not complete the Travel step

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

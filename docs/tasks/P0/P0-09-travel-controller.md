# Task brief: Travel controller

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-09 · Depends on: P0-04

## Target
`src/input/**`

## Change
- `travelMachine.ts` — pure state machine `createTravelMachine(config)` consuming normalized `TravelInput` events (wheel delta + time, pointer start/move/end, key, prev/next button, building tap, `travelDone`, `panelOpened`/`panelClosed`, reduced-motion flag) and emitting `TravelCommand`s. Rules from the technical plan § Travel controller: accumulate wheel to 60 px → one step → lock; lock lasts the travel plus a 200 ms quiet window; swipe ≥ 40 CSS px or ≥ 0.3 px/ms on the dominant axis; up/left = forward; tap = `goto`; panel open = ignore everything.
- `domAdapter.ts` — `attachTravelInput(el, machine, onCommand)`: sets `touch-action: none` on the world band, non-passive wheel listener with `preventDefault`, pointer events, arrow keys; returns a detach function.
- `config.ts` — re-exports contract defaults; all thresholds in one object.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Travel controller, `docs/product-plan.md` §5
- Do-not-touch: `src/core/contracts/**`, `src/world/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no camera or animation code; no page-level scroll handling outside the world band element

## Ownership
- You may edit: `src/input/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/input` passes, including:
  - 30 wheel events × 20 px within 400 ms → exactly 1 command
  - after `travelDone` + 200 ms with no wheel events, a new 60 px burst → 1 more command; a burst arriving at 150 ms → none
  - swipe 39 px → none; 41 px → 1 command; vertical up = `step +1`
  - `panelOpened` → wheel, swipe, keys ignored until `panelClosed`
  - tap on location `bank` → `goto bank`
- [ ] Human: on a real Android phone (Chrome), one flick never moves two buildings and the address bar does not jump; final thresholds recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

# Task brief: Bank entry transition and arrival cue

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-21 · Depends on: P0-20

## Target

`src/transitions/**`, `src/app/transitions.ts` (the extension point P0-20 leaves)

## Change

- Arrival cue: door hotspot pulses and receives focus; tap or Enter opens.
- Bank entry (product plan §5 table): character slows, entrance light/shutter activates, camera eases toward the door, then a counter surface unfolds into `PanelShell` (GSAP Flip from a DOM proxy positioned over the door). Exit reverses it.
- First viewing plays in full (≤ 1.2 s); later viewings are skippable and recorded in `seen`.
- Reduced motion: 150 ms cross-fade, no camera move.

## Constraints

- Read and follow: AGENTS.md, `docs/product-plan.md` §5, `docs/technical-implementation-plan.md` § Travel controller
- Do-not-touch: `src/world/**` internals (use the `WorldRenderer` interface), `src/ui/**`, `package.json`
- Allowed dependencies: gsap (installed)
- Non-goals: no other institutions' transitions

## Ownership

- You may edit: `src/transitions/**`, `src/app/transitions.ts`
- Do not edit: anything else

### Approved integration expansion

The user approved expanding this task's scope in the P0-21 worktree session. The
transition also touches `src/app/Game.tsx`, `src/app/App.module.css`, the English
and Telugu `app.json` strings, `src/world/renderer.ts` and its tests, and
`tests/e2e/transitions.spec.ts` with its three viewport references. The frozen
contracts, UI internals, dependencies, and registries remain unchanged.

The renderer exposes a concrete `transitionLocation` extension for the bank camera
and light; the frozen `WorldRenderer` contract is not changed. The app owns the
modal/travel lock and records `bank-entry` through the existing `transitionSeen`
action only when entry finishes. Animation cancellation cleans up DOM proxies
and stops camera/light tweens. Reduced motion uses only a 150 ms fade; test mode
jumps to the end state.

## Observable acceptance

- [ ] `pnpm e2e` transition spec: entry completes ≤ 1.2 s; second entry shows a working Skip; reduced-motion entry ≤ 200 ms
- [ ] End-state screenshots at 3 viewports match references committed in this PR
- [ ] Human: on a real Android phone, no dropped-frame stutter visible; recorded in PR

## Definition of Done

- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

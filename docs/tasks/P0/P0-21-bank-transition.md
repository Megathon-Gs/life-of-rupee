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

## Observable acceptance
- [ ] `pnpm e2e` transition spec: entry completes ≤ 1.2 s; second entry shows a working Skip; reduced-motion entry ≤ 200 ms
- [ ] End-state screenshots at 3 viewports match references committed in this PR
- [ ] Human: on a real Android phone, no dropped-frame stutter visible; recorded in PR

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

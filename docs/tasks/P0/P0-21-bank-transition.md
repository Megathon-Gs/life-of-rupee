# Task brief: Bank entry transition and arrival cue

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-21 · Depends on: P0-20

## Target

`src/transitions/**`, `src/app/transitions.ts` (the extension point P0-20 leaves)

## Change

### User-approved universal interior entry (current behavior)

After integrating main's interior PNGs, the user requested one entry treatment
for every Enter button whose location has an interior: the existing dark scrim
fades in over 500 ms; the menu and interior pop in together at 200 ms without sliding, camera
tweens, Flip, or a Skip button. Desktop retains the interior on the left and menu
on the right; phones retain the top image band. Reduced motion skips the fade
through existing motion tokens. Exit is immediate. Arrival focus/pulse, focus
trapping, Escape, backdrop dismissal, and travel locking remain. Locations without
an interior keep their existing behavior. All interior images preload on arrival.
The transition e2e spec checks the fade/reveal for all interiors, repeat/reloaded
entry, reduced motion, dismissal and updated three-viewport screenshots.

The original animation criteria below are superseded by this approved behavior.

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

The requested follow-up review also fixes shared-runner failures in `vite.config.ts`
(two unit-test workers to avoid starving accessibility scans) and
`playwright.config.ts` (a separately allocated preview port and two workers in CI).

The renderer exposes a concrete `transitionLocation` extension for the bank camera
and light; the frozen `WorldRenderer` contract is not changed. The app owns the
modal/travel lock and records `bank-entry` through the existing `transitionSeen`
action only when entry finishes. Animation cancellation cleans up DOM proxies
and stops camera/light tweens. Reduced motion uses only a 150 ms fade; test mode
jumps to the end state.

The e2e timing assertions drive Playwright's browser clock explicitly, rather than
counting shared-runner CPU scheduling delays as animation time. The real Android
no-stutter gate remains unchecked; no simulated test replaces that human check.

During LAN phone testing, the user approved a secure UUID fallback for plain HTTP.
`src/randomUUID.ts` uses native `crypto.randomUUID` when available, otherwise
`crypto.getRandomValues` with UUID v4 version/variant bits. All four callers in
`src/persistence/saveStore.ts` and `src/app/LevelPanel.tsx` use the helper. Unit
tests and an app e2e regression verify profile creation, saving, lesson completion,
and reload with `randomUUID` disabled. Existing IDs and save schemas are unchanged;
this does not enable HTTP service workers or replace HTTPS for deployment.

## Observable acceptance

- [ ] `pnpm e2e` transition spec: entry completes ≤ 1.2 s; second entry shows a working Skip; reduced-motion entry ≤ 200 ms
- [ ] End-state screenshots at 3 viewports match references committed in this PR
- [ ] Human: on a real Android phone, no dropped-frame stutter visible; recorded in PR

## Definition of Done

- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

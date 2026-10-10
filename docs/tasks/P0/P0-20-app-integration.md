# Task brief: App integration

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-20 · Depends on: P0-07, P0-08, P0-09, P0-10, P0-11, P0-12, P0-14, P0-15, P0-16, P0-17

## Target
`src/app/**`, `src/main.tsx`, `tests/e2e/fixtures/**`, `tests/e2e/app.spec.ts`, `src/content/locales/{en,te}/app.json`

## Change
Wire the modules into one app:
- Zustand store wrapping the P0-07 reducer; `derive` memoized.
- Boot: i18n init (P0-12) → `createSaveStore({ migrate })` with P0-07's migrator → `load` → profile picker (create / switch / remove) → mount `WorldRenderer` in the world band and `attachTravelInput` on it → React UI layer on top.
- Travel commands → `renderer.travelTo` → `travelDone` back to the machine → `travelled` action.
- Arrival at a location with an available level → door cue → Enter opens `PanelShell` → `LevelRunner` drives `DialogueSheet` and the registered interaction → `ResultsScreen` → `attemptCompleted` → save → `deriveWorldVisuals` → `renderer.applyVisuals`.
- Panel open → world band `inert` + `panelOpened` to the travel machine.
- Settings applied (language, reduced motion from OS or toggle, text size). `installLifecycleFlush`.
- Leave `src/app/transitions.ts` exporting no-op `onArrive`, `enterLocation` and `exitLocation` hooks (plain fade). P0-21 owns that file afterwards.
- Leave `src/app/textures.ts` returning the greybox `TextureProvider` passed to the renderer. P0-22 owns that file afterwards.
- Test mode (`?test=1`): fixed seed, world test mode, and a fixture level from `tests/e2e/fixtures/` when no real level is registered.

New strings go in the `app` namespace only (English + a Telugu draft marked `needsReview`); never edit another namespace.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § System architecture
- Do-not-touch: every module directory listed in Depends on (consume their public exports only; report bugs as comments on their cards), `package.json`
- Allowed dependencies: none new
- Non-goals: no transitions beyond a plain fade (P0-21); no real art (P0-22)

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm e2e tests/e2e/app.spec.ts` green on all 3 projects:
  - one swipe → protagonist at the next location; one wheel burst → one location
  - enter bank → fixture level → complete → results screen → teller variant applied
  - reload → same location and stars
  - scrolling inside the panel does not move the world
- [ ] The network allowlist test passes
- [ ] `pnpm typecheck && pnpm lint && pnpm test` pass

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

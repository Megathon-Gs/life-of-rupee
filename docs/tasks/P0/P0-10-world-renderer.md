# Task brief: World renderer (greybox)

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-10 · Depends on: P0-04

## Target
`src/world/**`

## Change
Implement `WorldRenderer` with PixiJS v8, using greybox art (flat-colour building blocks, a simple coloured protagonist sheet) until P0-22 swaps in real atlases.
- `scale.ts` — `scaleFor(bandHeightDevicePx) = max(1, floor(h / 270))`, `logicalWidth(viewportWidthDevicePx, s)`, `bandHeight(viewport)`: 100% of height in landscape, 60% in portrait.
- Render to a 270 px-high logical stage, scaled by the integer factor with nearest-neighbour sampling; leftover height filled with sky and pavement colours.
- Parallax layers with factors 0.1, 0.3, 0.6, 1.0, 1.2; camera and every layer offset rounded to whole logical pixels.
- Protagonist states idle/walk/run/arrive with facing via `scale.x`. `travelTo` tweens with GSAP; duration scales with distance, clamped 0.7–1.1 s; run cycle beyond two buildings; reduced motion → 150 ms cross-fade.
- All drawing goes through a `TextureProvider` interface in `src/world/textures.ts` with a greybox implementation, so P0-22 can plug in atlases without editing renderer internals.
- `applyVisuals(v)` diffs `WorldVisuals` and swaps location variants (greybox colour change is enough).
- Ticker paused when the tab is hidden. Test mode (`?test=1`): manual ticker stepping and `travelTo` jumping to its end state.
- Dev page `src/world/dev/index.html` showing the greybox street from a fixture `WorldDef`.

## Constraints
- Read and follow: AGENTS.md, docs/adr/0002, `docs/technical-implementation-plan.md` § World renderer
- Do-not-touch: `src/core/**`, `src/input/**`, `package.json`
- Allowed dependencies: pixi.js, gsap (installed)
- Non-goals: no text in the canvas; no input handling (P0-09); no real art (P0-22); no game rules

## Ownership
- You may edit: `src/world/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/world` passes: `scaleFor(1519)` = 5, `scaleFor(1080)` = 4, `scaleFor(200)` = 1; `logicalWidth(1170, 5)` = 234
- [ ] After any `travelTo`, every layer's `x` is an integer (test reads the containers)
- [ ] `travelTo` resolves in 0.7–1.1 s (±50 ms) for 1–3 building hops; ≤ 200 ms with reduced motion
- [ ] The dev page renders at 360×740 and 1440×900 without blurry scaling (screenshots in PR)

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

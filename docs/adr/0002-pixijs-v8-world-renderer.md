# ADR 0002 — PixiJS v8 for the world renderer (vs Phaser 3)

Status: accepted · Date: 2026-10-10 · Owner: Paisa Street team

## Context

The town is drawn on a 16 px tile grid at a fixed 270 px logical height and scrolled with
parallax. The renderer only draws the world: it holds no text and no game rules, because all
readable text (including Telugu) lives in the DOM and every rule lives in the pure core. We
need a small 2D renderer with sprite batching and crisp nearest-neighbour scaling, and we must
not fight engine systems that duplicate work React and the travel controller already do.

## Decision

Use PixiJS v8 for the world layer (`src/world/`).

## Consequences

- Positive: small 2D WebGL renderer with sprite batching and nearest-neighbour scaling; no
  scene/input/text opinions to unlearn, so the travel controller and React stay authoritative.
- Negative / cost: we build cameras, snap points and atlases ourselves instead of getting them
  from a game engine; the renderer must be diffed against derived state on every change.
- Follow-ups: P0-10 builds the greybox renderer; P0-13 packs per-district atlases.

## Alternatives considered

- Phaser 3 — rejected because its scene, input and text systems duplicate what React and our
  travel controller already do, and its bundled text handling is wrong for Telugu shaping.

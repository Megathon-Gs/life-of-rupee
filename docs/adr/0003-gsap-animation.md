# ADR 0003 — GSAP 3 for animation

Status: accepted · Date: 2026-10-10 · Owner: Lifeof₹ team

## Context

Travel across the street and the phone → UPI-panel morph are two views of one motion moment:
the Pixi camera moves while a DOM element changes shape. Driving them from two clocks causes
visible desync, and reduced-motion users need to cut or cross-fade instead of tween.

## Decision

Use GSAP 3 (including Flip) as the single animation clock for both the Pixi camera and DOM
morphs.

## Consequences

- Positive: one timeline keeps the canvas and DOM in step; Flip animates layout changes that
  CSS cannot; a single place to honour the reduced-motion setting.
- Negative / cost: one more runtime dependency; timelines must be stepped manually in
  `?test=1` mode so screenshots stay deterministic.
- Follow-ups: P0-09 and P0-21 use GSAP for travel and the bank-entry transition.

## Alternatives considered

- Motion (framer-motion) — rejected because it animates the DOM only and cannot drive the Pixi
  camera from the same clock.

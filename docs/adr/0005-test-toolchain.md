# ADR 0005 — Test toolchain: Vitest, fast-check, Playwright, axe and Lighthouse CI

Status: accepted · Date: 2026-10-10 · Owner: Lifeof₹ team

## Context

The plan turns finance lessons into property tests (a bug that would teach the wrong thing
must fail CI), needs component tests for the interaction kit, device-sized end-to-end runs of
the demo journey, automated accessibility checks, and a performance budget on a throttled
mobile profile.

## Decision

Use Vitest with fast-check for unit and property tests, Playwright (with `@axe-core/playwright`)
for end-to-end, visual-regression and accessibility runs, and Lighthouse CI for the mobile
performance budget.

## Consequences

- Positive: one Vite-native unit runner; property tests encode the maths lessons; device-sized
  e2e and screenshot diffs; a11y and perf gates run in CI.
- Negative / cost: Playwright downloads browsers and e2e runs are slower; screenshot tests need
  deterministic `?test=1` mode and approved references.
- Follow-ups: P0-14 owns the Playwright config, e2e harness and the separate e2e workflow; P0-01
  wires only the unit runner into CI.

## Alternatives considered

- Jest — rejected: needs extra transform config for a Vite/ESM project where Vitest already fits.
- Cypress — rejected: heavier runner and weaker screenshot/axe integration than Playwright here.

# ADR 0008 — ReceiptInspector config carries inputs, not totals

Status: accepted · Date: 2026-10-11 · Owner: Paisa Street team

## Context

P2-01 first shaped `ReceiptInspectorConfig` as item `amountPaise` plus pre-computed
`discountPaise`, `taxPaise` and `totalPaise`. That has no tax rate and no
discount-before/after-tax flag, so P2-04 could not show the rate as an assumption, could not
teach "tax applies to the discounted price", and could not derive every receipt number from
`src/core/finance` (`receiptTotals`) as its acceptance requires.

## Decision

Amend the P2 config only (no P0/P1 type changes): items carry `unitPricePaise` and an optional
`quantity`, and the config carries `discountPaise`, `taxRatePct` and `taxOnDiscounted`. The
subtotal, tax and total are computed by `receiptTotals`, never stored. `errors` is unchanged.

## Consequences

- Positive: content supplies prices, a rate and quantities; finance owns every derived number,
  so the receipt cannot drift from the maths.
- Negative / cost: this is a breaking change to a P2 config added the same day; no shipped
  content used the old shape.
- Follow-ups: P2-12 (Level 6 content) authors configs in the new shape.

## Alternatives considered

- Keep pre-computed totals and back-derive the rate in the UI — rejected as a hidden number
  source that cannot represent a before-tax discount.
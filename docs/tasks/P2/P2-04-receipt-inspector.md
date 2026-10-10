# Task brief: ReceiptInspector interaction

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-04 · Depends on: P2-01, P2-07

## Target
`src/ui/interactions/ReceiptInspector/**`, `src/content/locales/{en,te}/receiptInspector.json`

## Change
- A fictional shop receipt slides up as a long paper strip; the student taps lines to identify item price, discount, tax (GST rate shown as an assumption) and the total, then answers which total is correct.
- Teaches: discounts and taxes change the total; tax applies to the discounted price where the config says so.
- Same event contract and conventions as the P0/P1 interactions: `choice`/`hint`/`explanationOpened` events with configured error category and severity; "Simulated — never enter real details" banner; two hint levels; renders in `PanelShell`; tokens from P0-11; 360 px wide works.
- Do **not** register it in `src/ui/interactions/index.ts` (P2-25 does).

New strings go in the `receiptInspector` namespace only (English + a Telugu draft marked `needsReview`); never edit `common.json`.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §5, §6, §11, §12; `docs/technical-implementation-plan.md` § Level runner and content model
- Do-not-touch: other interactions, `src/ui/interactions/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no free-text inputs; no level content

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/interactions/ReceiptInspector` passes:
  - tapping the pre-discount subtotal as the amount paid → `receipt.discount_before_tax`
  - missing the tax line → `receipt.missed_tax`
  - correct total identified → `choice` correct and `onComplete`
  - every number on the receipt comes from `src/core/finance` (test asserts no number is typed into config except prices, rates and quantities)
- [ ] No `<input type="text">`, `<textarea>` or `contenteditable` rendered
- [ ] axe 0 violations; targets ≥ 44×44 CSS px; fully keyboard-operable

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

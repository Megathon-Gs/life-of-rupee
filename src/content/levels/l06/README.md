# Level 6 — Spending, receipts and taxes (`l06-receipts`)

Fictional shops, people, prices and tax rates. Every rate is a labelled assumption.

## Flow

hook → ReceiptInspector lesson → travel to `market` → decision (ScenarioChain: ReceiptInspector, then
BudgetAllocator follow-up) → consequence → transfer (2 receipts, discount before tax).
Receipt totals come from `receiptTotals` in `src/core/finance`; content supplies inputs only.

## Installment commitment

The decision step carries `configOverrides`: when `loan.activeInstallment` is `'true'` at level start,
the chain's budget link locks a fictional ₹500 installment into needs. Without the flag no loan is
shown. The amount is an assumption because the flag carries none. The choice is fixed at start and kept on resume.

## Scripted mistake path (2 stars)

Tap the subtotal as the amount to pay (`receipt.discount_before_tax`), correct to the total line,
finish the budget, answer the transfer correctly.

## Notes

- Contract changes made for this card: optional `configOverrides` on the decision step
  (`src/core/contracts/content.ts`, `src/level-runner/runner.ts`), and `receipt.*` / `budget.*`
  entries in `src/core/scoring/errorCategories.ts`.
- The decision must be registered with `scenarioChain` (and its child interactions) by P2-25.
- Source notes: the NCFE class 6 GST rate list is from 2017 and is not used. CGST section 15 shows a
  pending, not-yet-notified substitution of clause (3)(b); the claim relies on clause (3)(a) only.
- NGO educator sign-off and Telugu review are deferred (Telugu is `needsReview`).

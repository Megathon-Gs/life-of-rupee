# Task brief: OfferComparator interaction

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-04 · Depends on: P1-01

## Target
`src/ui/interactions/OfferComparator/**`

## Change
- Loan offer cards fan out (product plan §5 "Compare loans"), then each shows EMI, tenure, fees, **total repaid** and total interest, computed with `src/core/finance` `loanTotals` and `schedule` — never typed into config.
- A month-by-month principal/interest bar for the selected offer; every rate labelled "Assumption: …".
- Optional budget overlay: monthly EMI against a fictional income with rent and essentials, showing what is left for savings.
- Same event contract and conventions as the P0 interactions: `choice`/`hint`/`explanationOpened` events with configured error category and severity; "Simulated — never enter real details" banner; two hint levels; renders in `PanelShell`; tokens from P0-11; 360 px wide works.
- Do **not** register it in `src/ui/interactions/index.ts` (P1-14 does).

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §5, §6, §11; `docs/technical-implementation-plan.md` § Level runner and content model
- Do-not-touch: other interactions, `src/ui/interactions/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no free-text inputs; no level content

## Ownership
- You may edit: `src/ui/interactions/OfferComparator/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/interactions/OfferComparator` passes:
  - with config offers A (₹1,00,000, 12%, 12 mo) and B (₹1,00,000, 12%, 36 mo): displayed EMI for A is ₹8,884.88 and B's total interest is higher than A's
  - choosing the offer with the higher total cost when the task asks for the lowest → `loan.ignored_total_cost`
  - choosing by lowest EMI alone when it overruns the budget → `loan.emi_only`
  - displayed numbers equal `loanTotals()` output for every offer
- [ ] No `<input type="text">`, `<textarea>` or `contenteditable` rendered
- [ ] axe 0 violations; targets ≥ 44×44 CSS px; fully keyboard-operable

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

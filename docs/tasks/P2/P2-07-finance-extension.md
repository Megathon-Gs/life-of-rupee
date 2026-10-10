# Task brief: Finance maths for P2

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-07 · Depends on: P2-01

## Target
`src/core/finance/**`

## Change
Pure functions in integer paise, added beside the P0 ones (no behaviour change to `emi`, `schedule`, `loanTotals`, `compound`, `simple`, `priceAfter`, `purchasingPower`):
- `receipt.ts` — `receiptTotals(lines, { discount, taxRatePct, taxOnDiscounted })` → `{ subtotal, discount, taxable, tax, total }`.
- `payslip.ts` — `payslip(gross, deductions[])` → `{ gross, deductions, totalDeductions, net }`; deductions are labelled fictional items with amounts or percentages.
- `insurance.ts` — `claimOutcome(policy, event)` → `{ covered, payout, youPay, reason }` from coverage list, exclusions, deductible and cap. An excluded event pays 0 with `reason: 'excluded'`; maintenance is never a covered event.
- `goals.ts` — `monthsToGoal(target, monthly, annualRatePct)` for the Level 3 savings goal.
- `ranges.ts` — `illustrativeRange(principal, years, lowPct, highPct)` → `{ low, high }` for Level 11; no single "expected" value exported.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Finance maths
- Do-not-touch: everything outside `src/core/finance/`; `package.json`
- Allowed dependencies: none new
- Non-goals: no UI; no real tax slabs or real product rates (all rates are labelled assumptions in content)

## Ownership
- You may edit: `src/core/finance/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/core/finance` passes, with existing tests unchanged
- [ ] Property: `receiptTotals` total = taxable + tax, and a larger discount never raises the total
- [ ] Property: `payslip` net = gross − totalDeductions and net ≤ gross
- [ ] Property: `claimOutcome` payout + youPay = loss amount; payout ≤ cap; excluded → payout 0
- [ ] Property: `illustrativeRange` low ≤ high; with lowPct < 0 the low value can fall below principal
- [ ] Integer-paise results match a high-precision reference within 1 paisa

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

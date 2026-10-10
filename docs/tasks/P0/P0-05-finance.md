# Task brief: Finance maths

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-05 · Depends on: P0-04

## Target
`src/core/finance/**`

## Change
- `money.ts` — `Paise` branded integer; `rupees(n)`, `toRupees(p)`, `formatINR(p, locale)` with Indian digit grouping (₹1,00,000.00).
- `emi.ts` — `emi(principal, annualRatePct, months)`; `schedule(...)` returning month rows `{ principalPaid, interestPaid, balance }`; `loanTotals(..., fees)` returning `{ emi, totalRepaid, totalInterest }`. Zero rate → principal ÷ months.
- `interest.ts` — `compound(principal, annualRatePct, periodsPerYear, years)`, `simple(...)`.
- `inflation.ts` — `priceAfter(price, ratePct, years)`, `purchasingPower(ratePct, years)`.
- All results are integer paise, rounded half-up at the last step only.

## Constraints
- Read and follow: AGENTS.md, docs/adr/, `docs/technical-implementation-plan.md` § Finance maths
- Do-not-touch: `src/core/contracts/**`, `package.json`
- Allowed dependencies: none new (fast-check for tests)
- Non-goals: no UI, no rate data, no product names

## Ownership
- You may edit: `src/core/finance/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/core/finance` passes
- [ ] `emi(rupees(100000), 12, 12)` = ₹8,884.88
- [ ] `compound(rupees(10000), 7, 4, 1)` = ₹10,718.59
- [ ] Property: same principal and rate, longer tenure → lower EMI **and** higher total interest
- [ ] Property: total repaid ≥ principal for any rate ≥ 0 and fees ≥ 0
- [ ] Property: schedule principal rows sum to the principal within 1 paisa; final balance is 0
- [ ] Property: inflation > 0 → purchasing power strictly decreases each year
- [ ] Results match a BigInt reference implementation within 1 paisa

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

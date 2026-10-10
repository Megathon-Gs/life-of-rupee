# Task brief: Contracts extension for P1

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-01 · Depends on: gate G0

## Target
`src/core/contracts/**`

## Change
Additive changes only (no breaking edits to P0 types):
- Config types: `UpiPaymentConfig`, `MessageTriageConfig`, `OfferComparatorConfig` (offers with principal, annual rate, tenure, fees, and the assumptions label).
- Optional `when` condition on any level step: `{ flag: string, equals: string | boolean }`, evaluated against derived world flags.
- Location IDs `phone-shop`, `showroom`, `capstone`; optional `unlockedBy: LevelId[]` on `LocationDefSchema` (the shape P0-07's `derive` already reads); world flag `fraud.seenWarningSigns` (value `'true'`); a `features.capstone` boolean in app config.
- Error categories for Levels 4, 5 and 9 (e.g. `upi.pin_to_receive`, `upi.wrong_payee`, `fraud.shared_otp`, `fraud.clicked_link`, `fraud.urgency`, `loan.ignored_total_cost`, `loan.emi_only`, `loan.missed_payment`).
- `TeacherSummary` type: stars per skill branch, levels completed; no IDs.

## Constraints
- Read and follow: AGENTS.md, SPEC.md, `docs/technical-implementation-plan.md`
- Do-not-touch: everything outside contracts; `package.json`
- Allowed dependencies: none new
- Non-goals: no implementations

## Ownership
- You may edit: `src/core/contracts/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm typecheck && pnpm test` pass with **no changes** to existing P0 tests
- [ ] Fixture configs for the three new interactions parse; a step with `when` parses
- [ ] `pnpm e2e tests/e2e/demo-journey.spec.ts` still green

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

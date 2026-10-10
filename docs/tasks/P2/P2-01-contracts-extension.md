# Task brief: Contracts extension for P2

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-01 · Depends on: gate G1 (P1-14)

## Target
`src/core/contracts/**`

## Change
Additive changes only (no breaking edits to P0/P1 types):
- Config types: `BudgetAllocatorConfig`, `ReceiptInspectorConfig`, `TimeSliderConfig`, `ScenarioChainConfig` (an ordered list of `{ interaction: InteractionId, config, carry?: string[] }` links, where `carry` names values passed to the next link).
- `DocumentInspectorConfig` and `OfferComparatorConfig` extended (optional fields only) for a payslip (Level 8), an insurance policy and claim event (Level 10) and investment-instrument cards with risk, liquidity and time-horizon labels (Level 11).
- Location IDs `market`, `workplace`, `insurance-desk`, `learning-centre`; district IDs `urban`, `high-street`, `rural-connected`.
- World flags (string values): `savings.goalMet`, `loan.activeInstallment`, `insurance.policyInspected`, `curriculum.completed`.
- Error categories for Levels 1, 3, 6, 7, 8, 10, 11, 12 (e.g. `budget.no_essentials`, `budget.no_savings`, `saving.ignored_liquidity`, `receipt.missed_tax`, `receipt.discount_before_tax`, `inflation.nominal_vs_real`, `payslip.gross_as_net`, `insurance.excluded_event`, `insurance.ignored_deductible`, `invest.return_guaranteed`, `invest.ignored_horizon`).
- Sync schemas: `LearnerCode` (format `WORD-XXXX`), `SyncPush { attempts, settings, position }`, `SyncPull`, `ClassSummary` (per skill node: learners attempted, median best stars; any count below 5 typed as the literal `'<5'`). No name, contact or free-text field anywhere.
- `ConsentState { status: 'unknown' | 'granted' | 'declined', recordedAt, policyVersion }` in `Settings` (optional, defaults to `unknown`), with a save migration note for P2-20.

## Constraints
- Read and follow: AGENTS.md, SPEC.md, `docs/technical-implementation-plan.md` § Level runner and content model, § Privacy and security
- Do-not-touch: everything outside contracts; `package.json`
- Allowed dependencies: none new
- Non-goals: no implementations

## Ownership
- You may edit: `src/core/contracts/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm typecheck && pnpm test` pass with **no changes** to existing P0/P1 tests
- [ ] Fixture configs for the four new interactions and the three extended ones parse
- [ ] A `ClassSummary` with a count of 3 fails to parse unless written as `'<5'`
- [ ] `SyncPush` rejects any unknown key (`.strict()`)

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

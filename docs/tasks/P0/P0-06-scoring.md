# Task brief: Scoring rubric and review items

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-06 · Depends on: P0-04

## Target
`src/core/scoring/**`

## Change
- `rubric.ts` — `defaultRubric` and `score(events, rubric): ScoreResult` implementing, in order:
  1. 0 stars if the decision step never has a correct `choice`, or a `critical` error is not followed by a correct choice on the same step.
  2. P = minor 1 + major 2 + hint L1 0.5 + hint L2 1; `explanationOpened` costs 0. P = 0 → 3, P ≤ 2 → 2, P > 2 → 1.
  3. Wrong first answer on the transfer step → cap 2.
  4. Any critical error, even corrected → cap at `rubric.criticalCap` (default 1).
- `errorCategories.ts` — registry of known codes (`upi.pin_to_receive`, `fraud.shared_otp`, `loan.ignored_total_cost`, `inflation.nominal_vs_real`, plus Level 2 codes `kyc.*`, `bank.*`) with severity, skill node and review key.
- `review.ts` — `reviewItems(events)`: one item per error category (deduplicated), ordered critical → major → minor.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Scoring, `docs/product-plan.md` §7
- Do-not-touch: `src/core/contracts/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no time-based scoring of any kind; no UI

## Ownership
- You may edit: `src/core/scoring/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/core/scoring` passes, including this table:
  | Events (decision step unless noted) | Stars |
  | --- | --- |
  | correct only | 3 |
  | 1 minor, then correct | 2 |
  | 1 minor + 1 major, then correct (P = 3) | 1 |
  | hint L1, then correct | 2 |
  | explanationOpened ×5, then correct | 3 |
  | critical, never corrected | 0 |
  | critical, then correct, nothing else | 1 |
  | correct, transfer step wrong then correct | 2 |
  | no correct choice on the decision step | 0 |
- [ ] Property: `score` is deterministic and ignores event timestamps
- [ ] `reviewItems` on events with two identical errors returns one item

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

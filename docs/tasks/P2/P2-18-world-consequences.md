# Task brief: World consequences for the full journey

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-18 · Depends on: P2-01

## Target
`src/core/worldVisuals/**`

## Change
Extend `deriveWorldVisuals` with the curated consequences from product plan §8 (pure functions, no randomness):
- `savings.goalMet` → home exterior and interior upgrade variant.
- `loan.activeInstallment` → a recurring-repayment marker on the home and HUD wallet; later budgeting levels read the flag (P2-12 config), not the visuals.
- `insurance.policyInspected` → insurance desk agent recognises the player.
- `curriculum.completed` → the capstone centre opens (lit, door active) when `features.capstone` is on; otherwise a neutral "Financial Futures Centre" exterior stays locked.
- District reveal: `high-street` and `rural-connected` districts drawn lit once any of their levels is in `unlockedLocations`.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §8 ("Don't build an entire simulated national economy"); `docs/technical-implementation-plan.md` § World renderer
- Do-not-touch: `src/world/**` (P2-25 wires visuals to sprites), `src/core/contracts/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no vehicle traversal change; no consequence that depends on chance

## Ownership
- You may edit: `src/core/worldVisuals/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/core/worldVisuals` passes, with P0/P1 cases unchanged
- [ ] One test per flag above: flag absent → default variant; flag `'true'` → the new variant
- [ ] `curriculum.completed` with `features.capstone` off → centre stays locked
- [ ] Property: `deriveWorldVisuals` is pure (same input → deep-equal output)

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

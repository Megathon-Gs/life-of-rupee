# Task brief: SPEC.md from the product plan

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-02 · Depends on: —

## Target
`SPEC.md`, `docs/product-plan.md`

## Change
- Add the product plan as `docs/product-plan.md`. The coordinator provides the file (the original lives in the gitignored `.orca/drops/`); copy it verbatim.
- Write `SPEC.md` from `templates/SPEC.md`, condensing the product plan and the technical plan:
  1. Problem and goal (plan §1).
  2. Non-goals: wealth leaderboards, real personal or financial data, LLM dependency for core play, economy simulation, 3D, arbitrary LLM-generated interfaces (plan §7, §14).
  3. Users and stories: student on a phone, student on a lab desktop, NGO educator, product owner.
  4. Scope in/out for P0 and P1 (technical plan § Implementation phases).
  5. Interfaces: point to `src/core/contracts/` (P0-04) and the technical plan; do not duplicate types.
  6. Behaviour and edge cases: offline, reload mid-level, shared device, reduced motion, panel open while swiping.
  7. Constraints: privacy (plan §11), performance budgets and accessibility (technical plan § Testing).
  8. Acceptance: G0 = the 7-step demo journey; G1 = the P1 list. Every item verifiable.
  9. Open questions: copy from the technical plan § Risks.
  10. Milestones: P0–P3 with gates G0–G2.

## Constraints
- Read and follow: AGENTS.md, `docs/orca-kit/14-specs-and-architecture.md`, `docs/technical-implementation-plan.md`
- Do-not-touch: everything except the two target files
- Allowed dependencies: none
- Non-goals: no code; do not change the technical plan

## Ownership
- You may edit: `SPEC.md`, `docs/product-plan.md`
- Do not edit: anything else

## Observable acceptance
- [ ] `SPEC.md` has all 10 sections of `templates/SPEC.md`
- [ ] Every acceptance item is a command, test or observable outcome (no "works well")
- [ ] No "TBD" without a matching entry under Open questions
- [ ] `docs/product-plan.md` is byte-identical to the provided plan

## Definition of Done
- [ ] acceptance passes · [ ] docs updated · [ ] comment+status updated · [ ] PR small

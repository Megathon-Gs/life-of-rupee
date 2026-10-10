# Task brief: NGO pilot and gate G2 ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-27 · Depends on: P2-25, P2-26 · Gate: product owner and NGO educator sign G2

## Target
`docs/pilot/**` (plan, checklist, results), `tests/e2e/g2/**`

## Change
- G2 privacy gate (SPEC §10): an e2e journey proves the game works with no real student financial information, and the RLS suite proves learner A cannot read learner B's rows; both run in CI.
- Pilot plan with the NGO: devices, classes, learner-code slips, consent collected by the NGO, session schedule, support contact.
- Measure the product plan §15 success measures from aggregate class data only: first-navigation success, completion and voluntary replay by level, error categories before vs after practice, transfer-step performance, successful resumes, educator usefulness (short educator interview).
- Results write-up with findings and recommended fixes; file each fix as an issue.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §11, §15; SPEC.md §10
- Do-not-touch: `src/**`, `supabase/**`, `package.json`
- Allowed dependencies: none
- Non-goals: no individual student profiles in the results; no claims of outcomes not measured

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm e2e tests/e2e/g2` and `pnpm test:rls` green in CI
- [ ] Pilot results in `docs/pilot/results.md` use aggregate data only, with every count below 5 shown as "<5"
- [ ] ⛩ G2: product owner and NGO educator sign-off recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] sign-off · [ ] comment+status updated

# Task brief: Educator view

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-21 · Depends on: P2-01, P2-19

## Target
`src/educator/**` (a separate lazy route, `/educator`), `src/content/locales/{en,te}/educator.json`

## Change
- Educator sign-in (Supabase auth for educators only; never offered on the student screens).
- Create a class; issue N learner codes and print them as cut-out slips (code + class label, no student field). The code-to-student mapping stays on the NGO's offline class list (tech plan § Privacy).
- Class dashboard from `ClassSummary`: per skill node, learners attempted and median best stars; the most common error categories in plain words; every count below 5 shown as "<5".
- "Needs help" list keyed by learner code only, showing which skill to revisit; no attempt-level raw data.

New strings go in the `educator` namespace only (English + a Telugu draft marked `needsReview`).

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §11 (aggregate skill growth, not personal profiles), §15 success measures
- Do-not-touch: student screens, `src/persistence/**`, `supabase/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no leaderboard or ranking; no export of individual attempt logs; no name fields

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/educator` passes, including "<5" rendering for small cells
- [ ] The student bundle does not include `src/educator/**` (build-output test)
- [ ] Printed slip HTML contains no input or field for a student name
- [ ] axe 0 violations on dashboard and slip screens

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small

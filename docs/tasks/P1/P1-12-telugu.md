# Task brief: Telugu pass for P1 strings ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-12 · Depends on: P1-06, P1-07, P1-08, P1-10, P1-11 (and P1-13 if included) · Gate: NGO translator approves

## Target
`src/content/locales/te/**`

## Change
- Work with the NGO translator to replace every `needsReview` Telugu string in `common`, `l02`, `l04`, `l05`, `l09`, `capstone`, `skilltree` and `teacher` with reviewed text; clear the markers.
- Run the pseudo-locale and Telugu screenshot sets at 360 px; fix clipping by shortening strings with the translator, not by shrinking type.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §12
- Do-not-touch: English strings, code, `package.json`
- Allowed dependencies: none
- Non-goals: no new languages (Hindi/Urdu awaits the NGO's answer)

## Ownership
- You may edit: `src/content/locales/te/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm lint:content` passes and reports 0 `needsReview` strings
- [ ] Telugu screenshots of every P1 screen at 360 px show no clipping (attached)
- [ ] ⛩ Translator approval recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] sign-off · [ ] comment+status updated
